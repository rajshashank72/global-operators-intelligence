import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Users, UserCheck, UserX, Clock, Globe, TrendingUp } from 'lucide-react';
import { operators } from '../data/operators';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const NAVY = '#1a1a2e';
const GOLD = '#FFBF00';
const COLORS = ['#FFBF00', '#4CAF50', '#E84A4A', '#4A90E8'];

export default function AdminStats() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const approved = users.filter(u => u.status === 'approved').length;
  const pending  = users.filter(u => u.status === 'pending').length;
  const denied   = users.filter(u => u.status === 'denied').length;
  const admins   = users.filter(u => u.role === 'admin').length;

  // Operators by region
  const byRegion = {};
  operators.forEach(op => {
    byRegion[op.region] = (byRegion[op.region] || 0) + 1;
  });
  const regionData = Object.entries(byRegion).map(([name, value]) => ({ name, value }));

  // User status pie
  const userStatusData = [
    { name: 'Approved', value: approved },
    { name: 'Pending',  value: pending  },
    { name: 'Denied',   value: denied   },
  ].filter(d => d.value > 0);

  const KPICard = ({ icon: Icon, label, value, color, bg }) => (
    <div style={{
      background: '#fff', border: '1px solid #F0EBE0',
      borderRadius: 14, padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: color, fontFamily: "'Libre Baskerville', serif", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontFamily: "'Libre Baskerville', serif" }}>
          {label}
        </div>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid #EDE8DE', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontFamily: "'Libre Baskerville', serif" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: p.color || GOLD }}>{p.name}: <strong>{p.value}</strong></div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
          Admin Analytics
        </h1>
        <p style={{ fontSize: 13, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
          Dashboard usage stats and operator intelligence overview
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard icon={Users}     label="Total Users"      value={users.length} color={NAVY}      bg="rgba(26,26,46,0.08)" />
        <KPICard icon={UserCheck} label="Approved Users"   value={approved}     color="#2e7d32"   bg="rgba(76,175,80,0.10)" />
        <KPICard icon={Clock}     label="Pending Approval" value={pending}      color="#B8860B"   bg="rgba(255,191,0,0.10)" />
        <KPICard icon={Globe}     label="Total Operators"  value={operators.length} color={GOLD}  bg="rgba(255,191,0,0.10)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Operators by Region */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Operators by Region
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11, fontFamily: 'serif' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Status */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            User Access Status
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
              Loading...
            </div>
          ) : userStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={userStatusData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {userStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
              No users yet
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F0EBE0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
            All Users ({users.length})
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['USER', 'EMAIL', 'ROLE', 'STATUS'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #F0EBE0', background: '#FDFAF5', fontFamily: "'Libre Baskerville', serif" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id}
                style={{ borderBottom: idx < users.length - 1 ? '1px solid #F8F5EF' : 'none' }}
                onMouseOver={e => e.currentTarget.style.background = '#FDFAF5'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: GOLD, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {user.photo ? <img src={user.photo} alt="" style={{ width: 30, height: 30, objectFit: 'cover' }} /> : <Users size={13} color="#fff" />}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>{user.name || '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '11px 16px', fontSize: 12, color: '#666', fontFamily: "'Libre Baskerville', serif" }}>{user.email}</td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: user.role === 'admin' ? 'rgba(26,26,46,0.08)' : 'rgba(74,144,232,0.10)', color: user.role === 'admin' ? NAVY : '#1565C0', border: user.role === 'admin' ? '1px solid rgba(26,26,46,0.2)' : '1px solid rgba(74,144,232,0.25)', fontFamily: "'Libre Baskerville', serif" }}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: user.status === 'approved' ? 'rgba(76,175,80,0.12)' : user.status === 'denied' ? 'rgba(232,74,74,0.12)' : 'rgba(255,191,0,0.12)', color: user.status === 'approved' ? '#2e7d32' : user.status === 'denied' ? '#c62828' : '#B8860B', border: user.status === 'approved' ? '1px solid rgba(76,175,80,0.3)' : user.status === 'denied' ? '1px solid rgba(232,74,74,0.3)' : '1px solid rgba(255,191,0,0.3)', fontFamily: "'Libre Baskerville', serif", textTransform: 'capitalize' }}>
                    {user.status || 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}