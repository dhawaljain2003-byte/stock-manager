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
  STOCK_IN: { label: "Stock In", color: "#e8f5e9" },      // Light green
  PACKED:   { label: "Packed", color: "#ffebee" },        // Light red
  STOCK_OUT:{ label: "Stock Out", color: "#fffde7" }      // Light yellow
};

function StockManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", qty: "" });
  const [notification, setNotification] = useState(null);
  
  // Transfer modal
  const [transferItem, setTransferItem] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferQty, setTransferQty] = useState("");

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editQty, setEditQty] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Add new stock-in item
  const handleAdd = () => {
    if (!form.name || !form.qty || isNaN(form.qty) || Number(form.qty) <= 0) return;
    setItems([...items, {
      id: Date.now(),
      name: form.name.trim(),
      qty: Number(form.qty),
      status: "STOCK_IN"
    }]);
    setForm({ name: "", qty: "" });
    showNotification(`${form.qty}x ${form.name} added`);
  };

  // Delete item
  const handleDelete = (id) => {
    showNotification(`${items.find(i => i.id === id).name} deleted`);
    setItems(items.filter(item => item.id !== id));
  };

  // Transfer handlers
  const openTransferModal = (item, targetStatus) => {
    setTransferItem(item);
    setTransferTarget(targetStatus);
    setTransferQty("");
  };
  const handleTransfer = () => {
    const qtyToTransfer = Number(transferQty);
    if (!qtyToTransfer || qtyToTransfer <= 0 || qtyToTransfer > transferItem.qty) return;
    setItems(items => {
      let updatedItems = items.map(i =>
        i.id === transferItem.id
          ? { ...i, qty: i.qty - qtyToTransfer }
          : i
      );
      updatedItems = updatedItems.filter(i => !(i.id === transferItem.id && i.qty === 0));
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

  // Edit quantity handlers
  const openEditModal = (item) => {
    setEditItem(item);
    setEditQty(item.qty.toString());
  };
  const handleEditSave = () => {
    const newQty = Number(editQty);
    if (!newQty || newQty <= 0) return;
    setItems(items =>
      items.map(i =>
        i.id === editItem.id
          ? { ...i, qty: newQty }
          : i
      )
    );
    showNotification(
      `${editItem.name} quantity updated to ${newQty}`
    );
    setEditItem(null);
  };

  const columns = ["STOCK_IN", "PACKED", "STOCK_OUT"];

  return (
    <div style={{
      fontFamily: "Segoe UI, Arial, sans-serif",
      margin: "0 auto",
      maxWidth: "1200px",
      minHeight: "100vh",
      background: "#fafcfa"
    }}>
      <h1 style={{
        textAlign: "center",
        fontSize: "3rem",
        fontWeight: "bold",
        margin: "34px 0 30px"
      }}>Stock Management</h1>
      {/* Input */}
      <div style={{ display: "flex", justifyContent: "center", alignItems:"center", gap:"16px", margin: "0 0 42px" }}>
        <input
          placeholder="Item Name"
          value={form.name}
          style={{
            fontSize: "1.1rem",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            width: "200px"
          }}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={form.qty}
          style={{
            fontSize: "1.1rem",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            width: "140px"
          }}
          onChange={e => setForm({ ...form, qty: e.target.value })}
        />
        <button
          style={{
            fontSize: "1.1rem",
            padding: "10px 38px", borderRadius: "6px",
            background: "#037d50", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold"
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
        justifyContent: "center",
        alignItems: "flex-start",
        flexWrap: "wrap",
        paddingBottom: "40px"
      }}>
        {columns.map(col =>
          <div key={col} style={{
            flex: "1 1 330px",
            minWidth: "340px",
            maxWidth: "420px",
            background: statuses[col].color,
            borderRadius: "18px",
            padding: "30px 26px 36px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <div style={{
              textAlign: "center",
              fontSize: "1.55rem",
              fontWeight: "bold",
              marginBottom: "24px"
            }}>{statuses[col].label}</div>
            {/* Items */}
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px"
            }}>
            {items.filter(i => i.status === col).map(item =>
              <div key={item.id} style={{
                width: "97%",
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                padding: "18px 16px 18px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px"
              }}>
                <span style={{ fontSize: "1.15rem", fontWeight: "500", display:"flex", alignItems:"center", gap:"14px" }}>
                  {item.name}
                  <span style={{
                    background: "#dbead9",
                    color: "#1b6540",
                    borderRadius: "6px",
                    padding: "3px 12px",
                    fontWeight: "bold",
                    fontSize:"1rem"
                  }}>x{item.qty}</span>
                </span>
                <div style={{ display: "flex", alignItems:"center", gap:"6px" }}>
                  <button
                    style={{
                      background: "#f3f4fb", border: "none",
                      borderRadius: "6px", color: "#244ac2",
                      padding: "3px 8px", cursor: "pointer", fontSize:"1.12rem", marginRight:"5px"
                    }}
                    onClick={() => openEditModal(item)}
                    title="Edit Quantity"
                  >
                    ✎
                  </button>
                  <Menu
                    item={item}
                    onDelete={handleDelete}
                    onShowTransfer={openTransferModal}
                  />
                </div>
              </div>
            )}
            {items.filter(i => i.status === col).length === 0 &&
              <div style={{ textAlign: "center", color: "#888", padding: "28px 0", fontSize:"1.13rem" }}>No items</div>
            }
            </div>
          </div>
        )}
      </div>
      {/* Notification popup */}
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      {/* Transfer Modal */}
      {transferItem && (
        <div style={{
          position: "fixed", left: 0, top:0, width:"100vw",height:"100vh",
          background: "rgba(0,0,0,0.18)", zIndex: 1100, display:"flex", justifyContent:"center", alignItems:"center"
        }}>
          <div style={{
            background:"#fff",borderRadius:"11px",padding:"38px",minWidth:"340px",textAlign:"center",boxShadow:"0 4px 14px rgba(0,0,0,0.13)"
          }}>
            <h3 style={{marginBottom:"24px", fontSize:"1.33rem"}}>
              Transfer <b>{transferItem.name}</b> ({transferItem.qty} available) <br/>
              to <span style={{color:"#037d50"}}>{statuses[transferTarget].label}</span>
            </h3>
            <input
              type="number"
              min="1"
              max={transferItem.qty}
              value={transferQty}
              onChange={e => setTransferQty(e.target.value)}
              style={{
                fontSize: "1.11rem",padding: "8px",marginTop: "6px",width:"86px",borderRadius:"6px",border:"1px solid #ccc"
              }}
              placeholder="Quantity"
            />
            <div style={{marginTop:"25px", display:"flex", gap:"12px", justifyContent:"center"}}>
              <button onClick={handleTransfer} style={{
                background:"#037d50",color:"#fff",padding:"8px 18px",borderRadius:"6px",border:"none", fontWeight:"bold"
              }}>Transfer</button>
              <button onClick={()=>setTransferItem(null)} style={{
                background:"#ddd",color:"#333",padding:"8px 18px",borderRadius:"6px",border:"none"
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Quantity Modal */}
      {editItem && (
        <div style={{
          position: "fixed", left: 0, top:0, width:"100vw",height:"100vh",
          background: "rgba(0,0,0,0.18)", zIndex: 1100, display:"flex", justifyContent:"center", alignItems:"center"
        }}>
          <div style={{
            background:"#fff",borderRadius:"11px",padding:"38px",minWidth:"340px",textAlign:"center",boxShadow:"0 4px 14px rgba(0,0,0,0.13)"
          }}>
            <h3 style={{marginBottom:"24px", fontSize:"1.31rem"}}>
              Edit quantity for <b>{editItem.name}</b> <br/>
              <span style={{color:"#666"}}>Current: {editItem.qty}</span>
            </h3>
            <input
              type="number"
              min="1"
              value={editQty}
              onChange={e => setEditQty(e.target.value)}
              style={{
                fontSize: "1.11rem",padding: "8px",marginTop: "6px",width:"86px",borderRadius:"6px",border:"1px solid #ccc"
              }}
              placeholder="Quantity"
            />
            <div style={{marginTop:"25px", display:"flex", gap:"12px", justifyContent:"center"}}>
              <button onClick={handleEditSave} style={{
                background:"#244ac2",color:"#fff",padding:"8px 18px",borderRadius:"6px",border:"none", fontWeight:"bold"
              }}>Save</button>
              <button onClick={()=>setEditItem(null)} style={{
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
    <div style={{ display: "inline-block", position:"relative"}}>
      <button
        style={{
          background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", padding:"0 2px"
        }}
        onClick={() => setShow(s => !s)}
        aria-label="options"
      >⋮</button>
      {show &&
        <div style={{
          position: "absolute", right: "-2px", top: "110%",
          background: "#fff", borderRadius: "8px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
          padding: "8px 0", minWidth: "148px", zIndex:99
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
  fontSize: "1.08rem",
  borderBottom: "1px solid #eee",
  background: "#fff",
  color: "#333"
};

export default StockManagement;
