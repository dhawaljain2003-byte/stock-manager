import React, { useState } from "react";
// Notification popup component
const Notification = ({ message, onClose }) => (
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
const statuses = {
  STOCK_IN: { label: "Stock In", color: "#e8f5e9" },      // Light green
  PACKED:   { label: "Packed", color: "#ffebee" },        // Light red
  STOCK_OUT:{ label: "Stock Out", color: "#fffde7" }      // Light yellow
};
function StockManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", qty: "" });
  const [notification, setNotification] = useState(null);
  
  // Transfer modal states
  const [transferItem, setTransferItem] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferQty, setTransferQty] = useState("");
  const handleAdd = () => {
    if (!form.name || !form.qty || isNaN(form.qty) || Number(form.qty) <= 0) return;
    setItems([...items, {
      id: Date.now(),
      name: form.name,
      qty: Number(form.qty),
      status: "STOCK_IN"
    }]);
    setForm({ name: "", qty: "" });
    showNotification(`${form.qty}x ${form.name} added`);
  };
  const handleDelete = (id) => {
    showNotification(`${items.find(i => i.id === id).name} deleted`);
    setItems(items.filter(item => item.id !== id));
  };
  const openTransferModal = (item, targetStatus) => {
    setTransferItem(item);
    setTransferTarget(targetStatus);
    setTransferQty("");
  };
  const handleTransfer = () => {
    const qtyToTransfer = Number(transferQty);
    if (
      !qtyToTransfer ||
      qtyToTransfer <= 0 ||
      qtyToTransfer > transferItem.qty
    ) return;
    setItems(items => {
      let updatedItems = items.map(i =>
        i.id === transferItem.id
          ? { ...i, qty: i.qty - qtyToTransfer }
          : i
      );
      // Remove item if quantity becomes 0
      updatedItems = updatedItems.filter(i => !(i.id === transferItem.id && i.qty === 0));
      // Add transferred item to target column
      updatedItems.push({
        id: Date.now(),
        name: transferItem.name,
        qty: qtyToTransfer,
        status: transferTarget
      });
      return updatedItems;
    });
    showNotification(
      `${qtyToTransfer}x ${transferItem.name} moved to ${statuses[transferTarget].label}`
    );
    setTransferItem(null);
  };
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };
  const columns = ["STOCK_IN", "PACKED", "STOCK_OUT"];
  return (
    <div style={{
      fontFamily: "Segoe UI, Arial, sans-serif",
      margin: "0 auto",
      maxWidth: "1100px"
    }}>
      <h1 style={{
        textAlign: "center",
        fontSize: "3rem",
        fontWeight: "bold",
        margin: "34px 0 24px"
      }}>Stock Management</h1>
      {/* Input */}
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
      {/* Columns */}
      <div style={{
        display: "flex",
        gap: "32px",
        flexWrap: "wrap",
        justifyContent: "space-between"
      }}>
        {columns.map(col =>
          <div key={col} style={{
            flex: "1",
            minWidth: "320px",
            background: statuses[col].color,
            borderRadius: "16px",
            padding: "20px 18px 32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              textAlign: "center",
              fontSize: "1.35rem",
              fontWeight: "bold",
              marginBottom: "16px"
            }}>{statuses[col].label}</div>
            {/* Items */}
            {items.filter(i => i.status === col).map(item =>
              <div key={item.id} style={{
                background: "#fff", borderRadius: "10px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                margin: "10px 0",padding: "16px",
                display: "flex",alignItems: "center",justifyContent: "space-between"
              }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  {item.name} <sup style={{
                    background: "#eee", borderRadius: "4px",
                    padding: "1px 8px", marginLeft: "8px"
                  }}>x{item.qty}</sup>
                </span>
                <div style={{ position: "relative" }}>
                  {/* 3-dot menu */}
                  <Menu
                    item={item}
                    onDelete={handleDelete}
                    onShowTransfer={openTransferModal}
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
      {/* Notification popup */}
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      {/* Transfer Modal */}
      {transferItem && (
        <div style={{
          position: "fixed", left: 0, top:0, width:"100vw",height:"100vh",
          background: "rgba(0,0,0,0.2)", zIndex: 1002, display:"flex", justifyContent:"center", alignItems:"center"
        }}>
          <div style={{
            background:"#fff",borderRadius:"8px",padding:"30px",minWidth:"330px",textAlign:"center",boxShadow:"0 4px 14px rgba(0,0,0,0.11)"
          }}>
            <h3>
              Transfer {transferItem.name} ({transferItem.qty} available) <br/>
              to {statuses[transferTarget].label}
            </h3>
            <input
              type="number"
              min="1"
              max={transferItem.qty}
              value={transferQty}
              onChange={e => setTransferQty(e.target.value)}
              style={{
                fontSize: "1.1rem",padding: "8px",marginTop: "16px",width:"80px",borderRadius:"6px",border:"1px solid #ccc"
              }}
              placeholder="Quantity"
            />
            <div style={{marginTop:"22px"}}>
              <button onClick={handleTransfer} style={{
                background:"#037d50",color:"#fff",padding:"8px 18px",marginRight:"12px",borderRadius:"6px",border:"none"
              }}>Transfer</button>
              <button onClick={()=>setTransferItem(null)} style={{
                background:"#ddd",color:"#333",padding:"8px 18px",borderRadius:"6px",border:"none"
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Simple 3-dot menu component
function Menu({ item, onDelete, onShowTransfer }) {
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
          {item.status !== "STOCK_OUT" &&
            <div style={menuItemStyle} onClick={() => { onShowTransfer(item, "STOCK_OUT"); setShow(false); }}>
              Move to Stock Out
            </div>}
          {item.status !== "PACKED" &&
            <div style={menuItemStyle} onClick={() => { onShowTransfer(item, "PACKED"); setShow(false); }}>
              Move to Packed
            </div>}
          <div style={menuItemStyle} onClick={() => { onDelete(item.id); setShow(false); }}>
            Delete
          </div>
        </div>
      }
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
export default StockManagement;