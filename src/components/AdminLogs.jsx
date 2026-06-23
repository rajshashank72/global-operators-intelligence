import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, User, Clock, RefreshCw } from 'lucide-react';

const NAVY = '#1a1a2e';
const GOLD = '#FFBF00';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to users collection for activity
    const unsub = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLogs(data);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const getStatusStyle = (status) => {
    const map = {
      approved: { bg: 'rgba(76,175,80,0.12)', color: '#2e7d32', border: 'rgba(76,175,80,0.3)' },
      pending:  { bg: 'rgba(255,191,0,0.12)',  color: '#B8860B', border: 'rgba(255,191,0,0.3)' },
      denied:   { bg: 'rgba(232,74,74,0.12)',  color: '#c62828', border: 'rgba(232,74,74,0.3)' },
    };
    return map[status] || map.pending;
  };

  const getTimeAgo = (date) => {
    if (!date) return '—';
    const seconds = Math.floor((new Date() - date.toDate()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
          Activity Logs
        </h1>
        <p style={{ fontSize: 13, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
          User login history and access requests
        </p>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', border: '1px solid #F0EBE0',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
            Loading logs...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['USER', 'EMAIL', 'ROLE', 'STATUS', 'JOINED', 'LAST SEEN'].map(h => (
                  <th key={h} style={{
                    padding: '13px 16px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: '#B8860B',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '1px solid #F0EBE0', background: '#FDFAF5',
                    fontFamily: "'Libre Baskerville', serif", whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const ss = getStatusStyle(log.status);
                return (
                  <tr key={log.id}
                    style={{ borderBottom: idx < logs.length - 1 ? '1px solid #F8F5EF' : 'none' }}
                    onMouseOver={e => e.currentTarget.style.background = '#FDFAF5'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: GOLD, overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {log.photo
                            ? <img src={log.photo} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                            : <User size={14} color="#fff" />
                          }
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                          {log.name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#666', fontFamily: "'Libre Baskerville', serif" }}>
                      {log.email}
                    </td>

                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                        background: log.role === 'admin' ? 'rgba(26,26,46,0.08)' : 'rgba(74,144,232,0.10)',
                        color: log.role === 'admin' ? NAVY : '#1565C0',
                        border: log.role === 'admin' ? '1px solid rgba(26,26,46,0.2)' : '1px solid rgba(74,144,232,0.25)',
                        fontFamily: "'Libre Baskerville', serif",
                      }}>
                        {log.role || 'user'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                        background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                        fontFamily: "'Libre Baskerville', serif",
                        textTransform: 'capitalize',
                      }}>
                        {log.status || 'pending'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
                      {log.createdAt ? new Date(log.createdAt.toDate()).toLocaleDateString('en-IN') : '—'}
                    </td>

                    {/* Last seen */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
                      {getTimeAgo(log.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}