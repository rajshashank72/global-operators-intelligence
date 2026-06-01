import React from "react";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { googleSignIn } = useAuth();

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
        maxWidth: "380px",
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="ASR Aviation"
          style={{ height: "64px", marginBottom: "20px" }}
        />

        {/* Title */}
        <h1 style={{
          color: "#ffc117",
          fontSize: "24px",
          fontWeight: "700",
          marginBottom: "32px",
        }}>
          Welcome Back
        </h1>

        {/* Divider */}
        <div style={{
          borderTop: "1px solid #e8e0d0",
          marginBottom: "28px",
        }}/>

        {/* Google Sign In Button */}
        <button
          onClick={googleSignIn}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: "#e4ad15",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "14px 24px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            transition: "background 0.2s",
          }}
          onMouseOver={e => e.target.style.background = "#b8922a"}
          onMouseOut={e => e.target.style.background = "#FFBF00"}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: "20px", height: "20px" }}
          />
          Sign in with Google
        </button>

        {/* Footer note */}
        <p style={{
          color: "#999",
          fontSize: "12px",
          marginTop: "24px",
        }}>
          Access is restricted to approved users only
        </p>

      </div>
    </div>
  );
}