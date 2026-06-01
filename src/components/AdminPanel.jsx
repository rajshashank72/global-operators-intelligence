import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
    });
    return unsub;
  }, []);

  const updateStatus = async (userId, status) => {
    await updateDoc(doc(db, "users", userId), { status });
  };

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const denied = users.filter((u) => u.status === "denied");

  const getTimeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date.toDate()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const tabUsers = { pending, approved, denied }[activeTab];

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ color: "#1C1208", fontSize: "22px", margin: "0 0 4px", fontWeight: 700 }}>
          Admin Panel
        </h2>
        <p style={{ color: "#a08050", fontSize: "13px", margin: 0 }}>
          Manage user access to ASR Aviation Dashboard
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Pending", count: pending.length, color: "#92650a", bg: "#fffbf0", border: "#FFBF00" },
          { label: "Approved", count: approved.length, color: "#1b6b3a", bg: "#f0faf4", border: "#4caf50" },
          { label: "Denied", count: denied.length, color: "#b71c1c", bg: "#fff5f5", border: "#ef5350" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: stat.bg,
            border: `1px solid ${stat.border}55`,
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: "32px", fontWeight: "700", color: stat.color }}>
              {stat.count}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#a08050", fontWeight: 500 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e8dcc8",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8dcc8", padding: "0 20px", background: "#fdfaf5" }}>
          {["pending", "approved", "denied"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "14px 20px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#92650a" : "#a08050",
              borderBottom: activeTab === tab ? "2px solid #FFBF00" : "2px solid transparent",
              transition: "all 0.2s",
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{
                marginLeft: "8px",
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 600,
                background: tab === "pending" ? "#fff8e1" : tab === "approved" ? "#e8f5e9" : "#ffebee",
                color: tab === "pending" ? "#92650a" : tab === "approved" ? "#1b6b3a" : "#b71c1c",
              }}>
                {{ pending, approved, denied }[tab].length}
              </span>
            </button>
          ))}
        </div>

        {/* User List */}
        <div>
          {tabUsers.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#c0a870", fontSize: "14px" }}>
              No {activeTab} users
            </div>
          ) : (
            tabUsers.map((user) => (
              <div key={user.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 24px",
                borderBottom: "1px solid #f0e8d8",
                background: "#ffffff",
                transition: "background 0.15s",
              }}>

                {/* Avatar */}
                <div style={{
                  width: "42px", height: "42px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #FFBF0066",
                  flexShrink: 0,
                }}>
                  {user.photo ? (
                    <img src={user.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: "#fff8e1",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 600, color: "#92650a",
                    }}>
                      {user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "#1C1208" }}>
                    {user.name || "Unknown"}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#a08050" }}>
                    {user.email}
                  </p>
                </div>

                {/* Time */}
                <span style={{ fontSize: "11px", color: "#c0a870", marginRight: "8px", flexShrink: 0 }}>
                  {getTimeAgo(user.createdAt)}
                </span>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  {activeTab !== "approved" && (
                    <button onClick={() => updateStatus(user.id, "approved")} style={{
                      padding: "7px 16px",
                      borderRadius: "8px",
                      border: "1px solid #4caf5088",
                      background: "#f0faf4",
                      color: "#1b6b3a",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}>
                      ✓ Approve
                    </button>
                  )}
                  {activeTab !== "denied" && (
                    <button onClick={() => updateStatus(user.id, "denied")} style={{
                      padding: "7px 16px",
                      borderRadius: "8px",
                      border: "1px solid #ef535088",
                      background: "#fff5f5",
                      color: "#b71c1c",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}>
                      ✗ Deny
                    </button>
                  )}
                  {activeTab === "denied" && (
                    <button onClick={() => updateStatus(user.id, "pending")} style={{
                      padding: "7px 16px",
                      borderRadius: "8px",
                      border: "1px solid #FFBF0088",
                      background: "#fffbf0",
                      color: "#92650a",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}>
                      ↩ Reconsider
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}