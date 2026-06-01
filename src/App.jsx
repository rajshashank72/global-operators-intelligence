import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Overview from './components/Overview';
import OperatorsTable from './components/OperatorsTable';
import RoutePlanner from './components/RoutePlanner';
import FuelCost from './components/FuelCost';
import Analytics from './components/Analytics';
import SignIn from './components/SignIn';
import PendingApproval from './components/PendingApproval';
import AdminPanel from './components/AdminPanel';
import './index.css';

function AppContent() {
  const { currentUser, userStatus, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(true);

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1C1208",
      color: "#FFBF00",
      fontSize: "18px",
    }}>
      Loading...
    </div>
  );

  if (!currentUser) return <SignIn />;
  if (userStatus === 'pending') return <PendingApproval />;
  if (userStatus === 'denied') return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0ece4",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "48px 40px",
        textAlign: "center",
        maxWidth: "380px",
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ color: "#e74c3c", marginBottom: "12px" }}>Access Denied</h2>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Your access request has been denied by the admin.
          Please contact ASR Aviation for more information.
        </p>
      </div>
    </div>
  );

  return (
    <div className={darkMode ? 'app dark' : 'app light'}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <div className="main-content">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'operators' && <OperatorsTable />}
        {activeTab === 'route' && <RoutePlanner />}
        {activeTab === 'fuel' && <FuelCost />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}