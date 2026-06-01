import React from "react";
import { useAuth } from "../context/AuthContext";

export default function PendingApproval() {
  const { currentUser, logout } = useAuth();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0ece4",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "48px 40px",
        textAlign: "center",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="ASR Aviation"
          style={{ height: "64px", marginBottom: "20px" }}
        />

        {/* Pending Icon */}
        <div style={{
          width: "64px",
          height: "64px",
          background: "#fff8e6",
          border: "2px solid #e4ad15",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: "28px",
        }}>
          ⏳
        </div>

        <h2 style={{
          color: "#e4ad15",
          fontSize: "22px",
          fontWeight: "700",
          marginBottom: "12px",
        }}>
          Approval Pending
        </h2>

        <p style={{
          color: "#666",
          fontSize: "14px",
          lineHeight: "1.6",
          marginBottom: "8px",
        }}>
          Hi <strong>{currentUser?.displayName}</strong>,
        </p>

        <p style={{
          color: "#666",
          fontSize: "14px",
          lineHeight: "1.6",
          marginBottom: "28px",
        }}>
          Your request to access the ASR Aviation Dashboard
          has been submitted. Please wait for the admin to
          approve your account.
        </p>

        {/* User info card */}
        <div style={{
          background: "#f9f6f0",
          border: "1px solid #e8e0d0",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "28px",
          textAlign: "left",
        }}>
          <p style={{ color: "#999", fontSize: "11px", margin: "0 0 4px" }}>
            Signed in as
          </p>
          <p style={{ color: "#333", fontSize: "14px", fontWeight: "500", margin: 0 }}>
            {currentUser?.email}
          </p>
        </div>

        {/* Sign out button */}
        <button
          onClick={logout}
          style={{
            background: "transparent",
            color: "#FFBF00",
            border: "2px solid #FFBF00",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Sign Out
        </button>

      </div>
    </div>
  );
}