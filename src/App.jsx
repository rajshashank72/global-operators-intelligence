import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Overview from './components/Overview';
import OperatorsTable from './components/OperatorsTable';
import RoutePlanner from './components/RoutePlanner';
import Analytics from './components/Analytics';
import RateCard from './components/RateCard';
import AdminPanel from './components/AdminPanel';
import AdminLogs from './components/AdminLogs';
import AdminStats from './components/AdminStats';
import SignIn from './components/SignIn';
import PendingApproval from './components/PendingApproval';
import './index.css';

function AppContent() {
  const { currentUser, userStatus, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#FFFFFF', fontFamily: "'Libre Baskerville', serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
        <div style={{ color: '#FFBF00', fontSize: 16, fontWeight: 600 }}>
          Loading ASR Dashboard...
        </div>
      </div>
    </div>
  );

  if (!currentUser) return <SignIn />;
  if (userStatus === 'pending') return <PendingApproval />;
  if (userStatus === 'denied') return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f0ece4',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        padding: '48px 40px', textAlign: 'center',
        maxWidth: 380, width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        fontFamily: "'Libre Baskerville', serif",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: '#e74c3c', marginBottom: 12 }}>Access Denied</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          Your access request has been denied. Please contact ASR Aviation.
        </p>
      </div>
    </div>
  );

  return (
    <div className="app">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="page-layout" style={{
        paddingLeft: sidebarOpen ? 240 : 0,
        transition: 'padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div className="main-content">
          {activeTab === 'overview'    && <Overview />}
          {activeTab === 'operators'   && <OperatorsTable />}
          {activeTab === 'route'       && <RoutePlanner />}
          {activeTab === 'analytics'   && <Analytics />}
          {activeTab === 'ratecard'    && <RateCard />}
          {activeTab === 'admin'       && isAdmin && <AdminPanel />}
          {activeTab === 'adminlogs'   && isAdmin && <AdminLogs />}
          {activeTab === 'adminstats'  && isAdmin && <AdminStats />}
        </div>
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