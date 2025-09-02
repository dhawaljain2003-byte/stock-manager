import React, { useEffect, useState } from "react";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { app } from "./firebase"; // Make sure to export 'app' from your firebase.js

const db = getFirestore(app);

const statuses = {
  STOCK_IN: { label: "Stock In", color: "#e8f5e9" },       // Light green
  PACKED:   { label: "Packed", color: "#ffebee" },         // Light red
  STOCK_OUT:{ label: "Stock Out", color: "#fffde7" }       // Light yellow
};

function Notification({ message, onClose }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "#222",
      color: "#fff",
      padding: "16px 24px",
      borderRadius: "8px",
      zIndex: 1000,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
    }}>
      {message}
      <button style={{
        background: "none", border: "none", color: "#fff", marginLeft: "12px", cursor: "pointer"
      }} onClick={onClose}>✕</button>
    </div>
  );
}

const menuItemStyle = {
  padding: "12px 20px",
  cursor: "pointer",
  fontSize: "1.05rem",
  borderBottom: "1px solid #eee",
  background: "#fff",
};

function Menu({ item, onDelete, onShowTransfer, onShowEdit }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "inline-block" }}>
      <button
        style={{
          background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer"
        }}
        onClick={() => setShow(s => !s)}
        aria-label="options"
      >⋮</button>
      {show &&
        <div style={{
          position: "absolute", right: "-2px", top: "110%",
          background: "#fff", borderRadius: "8px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          padding: "8px 0", minWidth: "148px"
        }}>
          <div style={menuItemStyle} onClick={() => { onShowEdit(item); setShow(false); }}>
            Edit Quantity
          </div>
          {item.status !== "STOCK_OUT" &&
            <div style={menuItemStyle} onClick={() => { onShowTransfer(item, "STOCK_OUT"); setShow(false); }}>
              Move to Stock Out
            </div>}
          {item.status !== "PACKED" &&
            <div style={menuItemStyle} onClick={() => { onShowTransfer(item, "PACKED"); setShow(false); }}>
              Move to Packed
            </div>}
          <div style={menuItemStyle} onClick={() => { onDelete(item); setShow(false); }}>
            Delete
          </div>
        </div>
      }
    </div>
  );
}

function StockManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", qty: "" });
  const [notification, setNotification] = useState(null);

  // Transfer & edit modal states
  const [transferItem, setTransferItem] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferQty, setTransferQty] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editQty, setEditQty] = useState("");

  // Load data from Firebase
  useEffect(() => {
    const fetchItems = async () => {
      const qSnap = await getDocs(collection(db, "items"));
      setItems(qSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchItems();
  }, []);

  // Helper for notification
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Add new item
  const handleAdd = async () => {
    if (!form.name || !form.qty || isNaN(form.qty) || Number(form.qty) <= 0) return;
    try {
      const docRef = await addDoc(collection(db, "items"), {
        name: form.name,
        qty: Number(form.qty),
        status: "STOCK_IN"
      });
      setItems([...items, { id: docRef.id, name: form.name, qty: Number(form.qty), status: "STOCK_IN" }]);
      setForm({ name: "", qty: "" });
      showNotification(`${form.qty}x ${form.name} added`);
    } catch (e) {
      showNotification("Error adding item");
    }
  };

  // Delete item
  const handleDelete = async (item) => {
    try {
      await deleteDoc(doc(db, "items", item.id));
      setItems(items.filter(i => i.id !== item.id));
      showNotification(`${item.name} deleted`);
    } catch (e) {
      showNotification("Delete failed");
    }
  };

  // Transfer
  const openTransferModal = (item, targetStatus) => {
    setTransferItem(item);
    setTransferTarget(targetStatus);
    setTransferQty("");
  };

  const handleTransfer = async () => {
    const qtyToTransfer = Number(transferQty);
    if (!qtyToTransfer || qtyToTransfer <= 0 || qtyToTransfer > transferItem.qty) return;
    try {
      // Update source item qty
      await updateDoc(doc(db, "items", transferItem.id), { qty: transferItem.qty - qtyToTransfer });
      // If qty becomes 0, delete
      if (transferItem.qty - qtyToTransfer === 0) {
        await deleteDoc(doc(db, "items", transferItem.id));
      }
      // Add transferred item
      const docRef = await addDoc(collection(db, "items"), {
        name: transferItem.name,
        qty: qtyToTransfer,
        status: transferTarget
      });
      // Refresh
      const qSnap = await getDocs(collection(db, "items"));
      setItems(qSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      showNotification(`${qtyToTransfer}x ${transferItem.name} moved to ${statuses[transferTarget].label}`);
      setTransferItem(null);
    } catch (e) {
      showNotification("Transfer failed");
    }
  };

  // Edit quantity
  const openEditModal = (item) => {
    setEditItem(item);
    setEditQty(item.qty);
  };

  const handleEdit = async () => {
    const qty = Number(editQty);
    if (!qty || qty <= 0) return;
    try {
      await updateDoc(doc(db, "items", editItem.id), { qty });
      setItems(items.map(i => i.id === editItem.id ? { ...i, qty } : i));
      showNotification(`Quantity updated for ${editItem.name}`);
      setEditItem(null);
    } catch (e) {
      showNotification("Update failed");
    }
  };

  const columns = ["STOCK_IN", "PACKED", "STOCK_OUT"];

  return (
    <div style={{
      fontFamily: "Segoe UI, Arial, sans-serif",
      margin: "0 auto", maxWidth: "1100px"
    }}>
      <h1 style={{
        textAlign: "center", fontSize: "3rem", fontWeight: "bold", margin: "34px 0 24px"
      }}>Stock Management</h1>

      <div style={{ display: "flex", justifyContent: "center", margin: "0 0 32px" }}>
        <input
          placeholder="Item Name"
          value={form.name}
          style={{
            fontSize: "1.1rem", padding: "10px 14px", marginRight: "8px",
            borderRadius: "6px", border: "1px solid #ccc", width: "180px"
          }}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={form.qty}
          style={{
            fontSize: "1.1rem", padding: "10px 14px", marginRight: "8px",
            borderRadius: "6px", border: "1px solid #ccc", width: "100px"
          }}
          onChange={e => setForm({ ...form, qty: e.target.value })}
        />
        <button
          style={{
            fontSize: "1.1rem",
            padding: "10px 18px", borderRadius: "6px",
            background: "#037d50", color: "#fff", border: "none", cursor: "pointer"
          }}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>

      <div style={{
        display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "space-between"
      }}>
        {columns.map(col =>
          <div key={col} style={{
            flex: "1", minWidth: "320px", background: statuses[col].color,
            borderRadius: "16px", padding: "20px 18px 32px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              textAlign: "center", fontSize: "1.35rem", fontWeight: "bold", marginBottom: "16px"
            }}>{statuses[col].label}</div>
            {items.filter(i => i.status === col).map(item =>
              <div key={item.id} style={{
                background: "#fff", borderRadius: "10px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                margin: "10px 0", padding: "16px",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  {item.name} <sup style={{
                    background: "#eee", borderRadius: "4px",
                    padding: "1px 8px", marginLeft: "8px"
                  }}>x{item.qty}</sup>
                </span>
                <div style={{ position: "relative" }}>
                  <Menu
                    item={item}
                    onDelete={handleDelete}
                    onShowTransfer={openTransferModal}
                    onShowEdit={openEditModal}
                  />
                </div>
              </div>
            )}
            {items.filter(i => i.status === col).length === 0 &&
              <div style={{ textAlign: "center", color: "#888", padding: "24px 0" }}>No items</div>
            }
          </div>
        )}
      </div>

      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}

      {/* Transfer Modal */}
      {transferItem && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.2)", zIndex: 1002, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: "8px", padding: "30px", minWidth: "330px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.11)"
          }}>
            <h3>
              Transfer {transferItem.name} ({transferItem.qty} available) <br />
              to {statuses[transferTarget].label}
            </h3>
            <input
              type="number"
              min="1"
              max={transferItem.qty}
              value={transferQty}
              onChange={e => setTransferQty(e.target.value)}
              style={{
                fontSize: "1.1rem", padding: "8px", marginTop: "16px", width: "80px", borderRadius: "6px", border: "1px solid #ccc"
              }}
              placeholder="Quantity"
            />
            <div style={{ marginTop: "22px" }}>
              <button onClick={handleTransfer} style={{
                background: "#037d50", color: "#fff", padding: "8px 18px", marginRight: "12px", borderRadius: "6px", border: "none"
              }}>Transfer</button>
              <button onClick={() => setTransferItem(null)} style={{
                background: "#ddd", color: "#333", padding: "8px 18px", borderRadius: "6px", border: "none"
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.2)", zIndex: 1002, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: "8px", padding: "30px", minWidth: "330px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.11)"
          }}>
            <h3>
              Edit Quantity for {editItem.name}
            </h3>
            <input
              type="number"
              min="1"
              value={editQty}
              onChange={e => setEditQty(e.target.value)}
              style={{
                fontSize: "1.1rem", padding: "8px", marginTop: "16px", width: "80px", borderRadius: "6px", border: "1px solid #ccc"
              }}
              placeholder="Quantity"
            />
            <div style={{ marginTop: "22px" }}>
              <button onClick={handleEdit} style={{
                background: "#037d50", color: "#fff", padding: "8px 18px", marginRight: "12px", borderRadius: "6px", border: "none"
              }}>Update</button>
              <button onClick={() => setEditItem(null)} style={{
                background: "#ddd", color: "#333", padding: "8px 18px", borderRadius: "6px", border: "none"
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagement;
