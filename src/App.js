import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

// Notification popup component
const Notification = ({ message, onClose }) => (
  <div style={{
    position: "fixed", bottom: "24px", right: "24px",
    background: "#222", color: "#fff",
    padding: "16px 24px", borderRadius: "8px",
    zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
  }}>
    {message}
    <button
      style={{ background: "none", border: "none", color: "#fff", marginLeft: "12px", cursor: "pointer" }}
      onClick={onClose}
    >✕</button>
  </div>
);

const statuses = {
  STOCK_IN: { label: "Stock In", color: "#e8f5e9" },
  PACKED: { label: "Packed", color: "#ffebee" },
  STOCK_OUT: { label: "Stock Out", color: "#fffde7" },
};

function StockManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", qty: "" });
  const [notification, setNotification] = useState(null);

  // Firestore reference
  const itemsRef = collection(db, "items");

  // Fetch items in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.qty || isNaN(form.qty) || Number(form.qty) <= 0) return;
    await addDoc(itemsRef, {
      name: form.name,
      qty: Number(form.qty),
      status: "STOCK_IN",
    });
    setForm({ name: "", qty: "" });
    showNotification(`${form.qty}x ${form.name} added`);
  };

  const handleDelete = async (id, name) => {
    await deleteDoc(doc(db, "items", id));
    showNotification(`${name} deleted`);
  };

  const handleTransfer = async (item, targetStatus, qtyToTransfer) => {
    const itemRef = doc(db, "items", item.id);

    if (qtyToTransfer < item.qty) {
      // Reduce quantity in original item
      await updateDoc(itemRef, { qty: item.qty - qtyToTransfer });
      // Add new document in target column
      await addDoc(itemsRef, {
        name: item.name,
        qty: qtyToTransfer,
        status: targetStatus,
      });
    } else {
      // Move completely
      await updateDoc(itemRef, { status: targetStatus });
    }

    showNotification(`${qtyToTransfer}x ${item.name} moved to ${statuses[targetStatus].label}`);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const columns = ["STOCK_IN", "PACKED", "STOCK_OUT"];

  return (
    <div style={{ fontFamily: "Segoe UI, Arial, sans-serif", margin: "0 auto", maxWidth: "1100px" }}>
      <h1 style={{ textAlign: "center", fontSize: "3rem", fontWeight: "bold", margin: "34px 0 24px" }}>
        Stock Management
      </h1>

      {/* Input */}
      <div style={{ display: "flex", justifyContent: "center", margin: "0 0 32px" }}>
        <input
          placeholder="Item Name"
          value={form.name}
          style={{ fontSize: "1.1rem", padding: "10px 14px", marginRight: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "180px" }}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={form.qty}
          style={{ fontSize: "1.1rem", padding: "10px 14px", marginRight: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "100px" }}
          onChange={e => setForm({ ...form, qty: e.target.value })}
        />
        <button
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "6px", background: "#037d50", color: "#fff", border: "none", cursor: "pointer" }}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>

      {/* Columns */}
      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "space-between" }}>
        {columns.map(col =>
          <div key={col} style={{ flex: "1", minWidth: "320px", background: statuses[col].color, borderRadius: "16px", padding: "20px 18px 32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: "bold", marginBottom: "16px" }}>{statuses[col].label}</div>
            {items.filter(i => i.status === col).map(item =>
              <div key={item.id} style={{ background: "#fff", borderRadius: "10px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", margin: "10px 0", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  {item.name} <sup style={{ background: "#eee", borderRadius: "4px", padding: "1px 8px", marginLeft: "8px" }}>x{item.qty}</sup>
                </span>
                <Menu
                  item={item}
                  onDelete={handleDelete}
                  onTransfer={handleTransfer}
                />
              </div>
            )}
            {items.filter(i => i.status === col).length === 0 &&
              <div style={{ textAlign: "center", color: "#888", padding: "24px 0" }}>No items</div>}
          </div>
        )}
      </div>

      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
    </div>
  );
}

// Simple 3-dot menu
function Menu({ item, onDelete, onTransfer }) {
  const [show, setShow] = useState(false);
  const [qty, setQty] = useState(1);

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <button
        style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }}
        onClick={() => setShow(s => !s)}
      >⋮</button>
      {show &&
        <div style={{ position: "absolute", right: "-2px", top: "110%", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "8px 0", minWidth: "160px" }}>
          {item.status !== "STOCK_OUT" &&
            <div style={menuItemStyle}>
              <input type="number" min="1" max={item.qty} value={qty} onChange={e => setQty(e.target.value)} style={{ width: "50px", marginRight: "6px" }} />
              <button onClick={() => { onTransfer(item, "STOCK_OUT", Number(qty)); setShow(false); }}>→ Stock Out</button>
            </div>}
          {item.status !== "PACKED" &&
            <div style={menuItemStyle}>
              <input type="number" min="1" max={item.qty} value={qty} onChange={e => setQty(e.target.value)} style={{ width: "50px", marginRight: "6px" }} />
              <button onClick={() => { onTransfer(item, "PACKED", Number(qty)); setShow(false); }}>→ Packed</button>
            </div>}
          <div style={menuItemStyle} onClick={() => { onDelete(item.id, item.name); setShow(false); }}>
            Delete
          </div>
        </div>}
    </div>
  );
}

const menuItemStyle = { padding: "10px", fontSize: "0.95rem", borderBottom: "1px solid #eee" };

export default StockManagement;
