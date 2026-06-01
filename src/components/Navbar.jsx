import React from 'react';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { id: 'overview', label: '🏠 Overview' },
  { id: 'operators', label: '✈️ Operators' },
  { id: 'route', label: '🗺️ Route Planner' },
  { id: 'fuel', label: '⛽ Fuel & Cost' },
  { id: 'analytics', label: '📊 Analytics' },
];

export default function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode }) {
  const { isAdmin, logout, currentUser } = useAuth();
  const gold = '#FFBF00';
  const navBg = darkMode ? '#251A0A' : '#FFFFFF';
  const borderColor = darkMode ? '#3D2A10' : '#D4C4A0';
  const textColor = darkMode ? '#F5ECD7' : '#1C1208';
  const mutedColor = darkMode ? '#B89A6A' : '#7A5C2A';

  const allTabs = isAdmin
    ? [...tabs, { id: 'admin', label: '🛡️ Admin' }]
    : tabs;

  return (
    <nav style={{
      background: navBg,
      borderBottom: `2px solid ${borderColor}`,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
    }}>

      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/logo.png"
          alt="ASR Aviation"
          style={{
            height: '60px',
            width: 'auto',
            borderRadius: '8px',
            background: darkMode ? 'transparent' : '#FFFFFF',
            padding: '3px'
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div>
          <div style={{ color: gold, fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>ASR AVIATION</div>
          <div style={{ color: mutedColor, fontSize: '10px', letterSpacing: '1px' }}>GLOBAL OPERATOR INTELLIGENCE</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {allTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id
                ? tab.id === 'admin' ? '#FFBF00' : gold
                : 'transparent',
              color: activeTab === tab.id ? '#1C1208' : mutedColor,
              border: tab.id === 'admin' && activeTab !== 'admin'
                ? '1px solid #FFBF0055'
                : 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RIGHT SIDE — Dark mode + User info + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* User email */}
        {currentUser && (
          <span style={{ fontSize: '12px', color: mutedColor }}>
            {currentUser.email}
          </span>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: darkMode ? '#3D2A10' : '#EDE5D4',
            border: `1px solid ${borderColor}`,
            borderRadius: '20px',
            padding: '6px 14px',
            cursor: 'pointer',
            color: textColor,
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid #ef535055',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            color: '#ef5350',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Sign Out
        </button>

      </div>
    </nav>
  );
}