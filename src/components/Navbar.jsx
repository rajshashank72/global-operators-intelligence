import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Plane, Map, BarChart, RefreshCw, Users, Activity, BarChart2 } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'overview',  label: 'Overview',      icon: 'overview' },
  { key: 'operators', label: 'Operators',     icon: 'operators' },
  { key: 'route',     label: 'Route Planner', icon: 'route' },
  { key: 'analytics', label: 'Analytics',     icon: 'analytics' },
  { key: 'ratecard',  label: 'Updation',      icon: 'ratecard' },
];

const ADMIN_NAV_ITEMS = [
  { key: 'admin',      label: 'User Management', icon: 'users' },
  { key: 'adminlogs',  label: 'Activity Logs',   icon: 'activity' },
  { key: 'adminstats', label: 'Admin Analytics',  icon: 'bar-chart' },
];

function NavIcon({ icon, size = 16 }) {
  const props = { size, strokeWidth: 1.8 };
  switch (icon) {
    case 'overview':   return <LayoutDashboard {...props} />;
    case 'operators':  return <Plane {...props} />;
    case 'route':      return <Map {...props} />;
    case 'analytics':  return <BarChart {...props} />;
    case 'ratecard':   return <RefreshCw {...props} />;
    case 'users':      return <Users {...props} />;
    case 'activity':   return <Activity {...props} />;
    case 'bar-chart':  return <BarChart2 {...props} />;
    default:           return null;
  }
}

export default function Navbar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const firstName = currentUser?.displayName?.split(' ')[0] || 'User';

  return (
    <>
      {/* ══════════════════════════════
          TOP BAR
      ══════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #EEEBE4',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        gap: 16,
      }}>

        {/* HAMBURGER */}
        <div
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            width: 40, height: 40,
            borderRadius: 8,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 5, cursor: 'pointer', flexShrink: 0,
            background: sidebarOpen ? '#FFF8EC' : 'transparent',
            border: '1px solid transparent',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#FFF8EC'; e.currentTarget.style.borderColor = '#EDE8DE'; }}
          onMouseOut={e => { if (!sidebarOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
        >
          <div style={{ width: 18, height: 2, background: sidebarOpen ? '#FFBF00' : '#555', borderRadius: 2, transition: 'all 0.2s' }} />
          <div style={{ width: 18, height: 2, background: sidebarOpen ? '#FFBF00' : '#555', borderRadius: 2, transition: 'all 0.2s' }} />
          <div style={{ width: 18, height: 2, background: sidebarOpen ? '#FFBF00' : '#555', borderRadius: 2, transition: 'all 0.2s' }} />
        </div>

        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img src="/logo.png" alt="ASR" style={{ height: 150, width: 150, objectFit: 'contain', borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1a1a2e', letterSpacing: '0.5px', whiteSpace: 'nowrap', fontFamily: "'Libre Baskerville', serif" }}>
              ASR AVIATION
            </div>
            <div style={{ fontSize: 12, color: '#FFBF00', letterSpacing: '1px', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: "'Libre Baskerville', serif" }}>
              GLOBAL OPERATOR INTELLIGENCE
            </div>
          </div>
        </div>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* RIGHT — Bell + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

          {/* Bell */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#F8F5EF', border: '1px solid #EDE8DE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15, position: 'relative',
          }}>
            🔔
            <div style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, borderRadius: '50%',
              background: '#FFBF00', border: '2px solid #fff',
            }} />
          </div>

          {/* Profile */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setProfileOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', padding: '5px 10px 5px 5px',
                borderRadius: 9, border: '1px solid #EDE8DE',
                background: profileOpen ? '#FFF8EC' : '#FAFAFA',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#FFF8EC'}
              onMouseOut={e => { if (!profileOpen) e.currentTarget.style.background = '#FAFAFA'; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: '#FFBF00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#fff', fontSize: 12,
                flexShrink: 0, overflow: 'hidden',
              }}>
                {currentUser?.photoURL
                  ? <img src={currentUser.photoURL} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                  : initials}
              </div>
              <div style={{ lineHeight: 1.35 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', fontFamily: "'Libre Baskerville', serif", whiteSpace: 'nowrap' }}>
                  {firstName}
                </div>
                <div style={{ fontSize: 10, color: '#FFBF00', fontWeight: 700, fontFamily: "'Libre Baskerville', serif" }}>
                  {isAdmin ? 'Admin' : 'Member'}
                </div>
              </div>
              <span style={{ fontSize: 9, color: '#bbb' }}>▼</span>
            </div>

            {/* Dropdown */}
            {profileOpen && (
              <div style={{
                position: 'absolute', top: 46, right: 0,
                background: '#fff', border: '1px solid #EDE8DE',
                borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
                minWidth: 180, zIndex: 9999, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', background: '#FDFAF5', borderBottom: '1px solid #F0EBE0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', fontFamily: "'Libre Baskerville', serif" }}>
                    {currentUser?.displayName}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, fontFamily: "'Libre Baskerville', serif" }}>
                    {currentUser?.email}
                  </div>
                </div>
                <div
                  onClick={logout}
                  style={{ padding: '12px 16px', fontSize: 13, cursor: 'pointer', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Libre Baskerville', serif" }}
                  onMouseOver={e => e.currentTarget.style.background = '#FFF5F5'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚪 Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.18)',
            zIndex: 800, backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* ══════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: 64, left: 0, bottom: 0,
        width: 240,
        background: '#FFFFFF',
        borderRight: '1px solid #EEEBE4',
        display: 'flex', flexDirection: 'column',
        zIndex: 900,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.08)' : 'none',
        overflowY: 'auto',
      }}>

        <div style={{ padding: '20px 12px', flex: 1 }}>

          {/* MAIN MENU LABEL */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#C8BFB0',
            letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '0 10px', marginBottom: 8,
            fontFamily: "'Libre Baskerville', serif",
          }}>
            Main Menu
          </div>

          {/* MAIN NAV ITEMS */}
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.key;
            return (
              <div
                key={item.key}
                onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '12px 12px', borderRadius: 9,
                  marginBottom: 3, cursor: 'pointer',
                  background: active ? 'rgba(255,191,0,0.12)' : 'transparent',
                  color: active ? '#B8860B' : '#1a1a2e',
                  fontWeight: active ? 700 : 600, fontSize: 13,
                  borderLeft: active ? '3px solid #FFBF00' : '3px solid transparent',
                  transition: 'all 0.15s',
                  fontFamily: "'Libre Baskerville', serif",
                  userSelect: 'none',
                }}
                onMouseOver={e => { if (!active) { e.currentTarget.style.background = '#FFF8EC'; e.currentTarget.style.color = '#1a1a2e'; } }}
                onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a1a2e'; } }}
              >
                <span style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'currentColor' }}>
                  <NavIcon icon={item.icon} />
                </span>
                {item.label}
              </div>
            );
          })}

          {/* ADMIN SECTION */}
          {isAdmin && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: '#C8BFB0',
                letterSpacing: '1.5px', textTransform: 'uppercase',
                padding: '0 10px', marginBottom: 8,
                fontFamily: "'Libre Baskerville', serif",
              }}>
                Admin
              </div>

              {ADMIN_NAV_ITEMS.map((item) => {
                const active = activeTab === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: '12px 12px', borderRadius: 9,
                      marginBottom: 3, cursor: 'pointer',
                      background: active ? '#2d1f5e' : 'transparent',
                     color: active ? '#a78bfa' : '#1a1a2e',
                      fontWeight: active ? 700 : 500, fontSize: 13,
                      borderLeft: active ? '3px solid #a78bfa' : '3px solid transparent',
                      transition: 'all 0.15s',
                      fontFamily: "'Libre Baskerville', serif",
                      userSelect: 'none',
                    }}
                    onMouseOver={e => { if (!active) { e.currentTarget.style.background = '#F3F0FF'; e.currentTarget.style.color = '#5b21b6'; } }}
                    onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a1a2e'; } }}
                  >
                    <span style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <NavIcon icon={item.icon} />
                    </span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div style={{ height: 1, background: '#EEEBE4', margin: '0 16px' }} />

        {/* BOTTOM USER STRIP */}
        <div style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#FDFAF5',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: '#FFBF00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 12,
            flexShrink: 0, overflow: 'hidden',
          }}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="" style={{ width: 34, height: 34, objectFit: 'cover' }} />
              : initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Libre Baskerville', serif" }}>
              {currentUser?.displayName || 'User'}
            </div>
            <div style={{ fontSize: 10, color: '#FFBF00', fontWeight: 700, fontFamily: "'Libre Baskerville', serif" }}>
              {isAdmin ? 'Admin' : 'Member'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}