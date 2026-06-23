import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { AIRCRAFT_RATES } from '../data/rateCard';
import { Save, RotateCcw, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';

const GOLD = '#FFBF00';
const NAVY = '#1a1a2e';

const FIRESTORE_DOC = 'config/rateCard';

export default function RateCard() {
  const [rates, setRates]         = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedBy, setUpdatedBy] = useState('');

  // Load from Firestore on mount, fallback to rateCard.js
  useEffect(() => {
  const [col, docId] = FIRESTORE_DOC.split('/');
  const ref = doc(db, col, docId);

  // First check if doc exists, if not create it
  getDoc(ref).then(async (snap) => {
    if (!snap.exists() || !snap.data()?.rates) {
      await setDoc(ref, {
        rates: AIRCRAFT_RATES,
        updatedAt: new Date(),
        updatedBy: 'System (Default)',
      });
    }
  });

  // Then listen for real-time updates
  const unsub = onSnapshot(ref, (snap) => {
    if (snap.exists() && snap.data()?.rates) {
      const data = snap.data();
      setRates(data.rates);
      setLastUpdated(data.updatedAt?.toDate?.() || null);
      setUpdatedBy(data.updatedBy || '');
    } else {
      setRates(AIRCRAFT_RATES);
    }
    setLoading(false);
  });

  return unsub;
}, []);

  const startEdit = (type, field, currentVal) => {
    setEditingId(`${type}__${field}`);
    setEditVal(currentVal.toString());
    setSaved(false);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditVal('');
  };

  const saveEdit = async (type, field) => {
    const numVal = parseFloat(editVal);
    if (isNaN(numVal) || numVal <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updatedRates = rates.map(r =>
        r.type === type ? { ...r, [field]: numVal } : r
      );

      const [col, docId] = FIRESTORE_DOC.split('/');
      await setDoc(doc(db, col, docId), {
        rates: updatedRates,
        updatedAt: new Date(),
        updatedBy: 'User',
      }, { merge: true });

      setEditingId(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Reset all rates to default values? This cannot be undone.')) return;
    setSaving(true);
    try {
      const [col, docId] = FIRESTORE_DOC.split('/');
      await setDoc(doc(db, col, docId), {
        rates: AIRCRAFT_RATES,
        updatedAt: new Date(),
        updatedBy: 'System (Reset)',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Reset failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Editable cell component
  const EditableCell = ({ type, field, value, prefix = '', suffix = '' }) => {
    const id = `${type}__${field}`;
    const isEditing = editingId === id;

    if (isEditing) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFF8EC', border: `1.5px solid ${GOLD}`, borderRadius: 7, padding: '4px 8px', gap: 4 }}>
            {prefix && <span style={{ fontSize: 12, color: '#888' }}>{prefix}</span>}
            <input
              type="number"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit(type, field);
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
              style={{
                width: 90, border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: 600, color: NAVY,
                outline: 'none', fontFamily: "'Libre Baskerville', serif",
              }}
            />
            {suffix && <span style={{ fontSize: 12, color: '#888' }}>{suffix}</span>}
          </div>
          <button
            onClick={() => saveEdit(type, field)}
            disabled={saving}
            style={{ background: GOLD, border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Save size={11} /> {saving ? '...' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            style={{ background: 'none', border: '1px solid #EDE8DE', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11, color: '#888' }}
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={() => startEdit(type, field, value)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
          transition: 'background 0.15s', group: true,
        }}
        onMouseOver={e => e.currentTarget.style.background = '#FFF8EC'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        title="Click to edit"
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
        <Edit3 size={11} color="#ccc" />
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ color: '#888', fontFamily: "'Libre Baskerville', serif" }}>Loading rate card...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Rate Card
          </h1>
          <p style={{ fontSize: 13, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
            Live charter rates — click any value to edit. Changes apply instantly across the dashboard.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status */}
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2e7d32', fontSize: 13, fontFamily: "'Libre Baskerville', serif" }}>
              <CheckCircle size={15} /> Saved!
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c62828', fontSize: 13, fontFamily: "'Libre Baskerville', serif" }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={resetToDefaults}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 8,
              background: '#fff', border: '1px solid #EDE8DE',
              color: '#888', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: "'Libre Baskerville', serif",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#E84A4A'; e.currentTarget.style.color = '#E84A4A'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE8DE'; e.currentTarget.style.color = '#888'; }}
          >
            <RotateCcw size={13} /> Reset to Defaults
          </button>
        </div>
      </div>

      {/* Last updated info */}
      {lastUpdated && (
        <div style={{ fontSize: 12, color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
          Last updated: {lastUpdated.toLocaleString('en-IN')} {updatedBy ? `by ${updatedBy}` : ''}
        </div>
      )}

      {/* ── RATE TABLE ── */}
      <div style={{
        background: '#fff', border: '1px solid #F0EBE0',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['AIRCRAFT TYPE', 'EXAMPLES', 'CHARTER RATE/HR', 'CRUISE SPEED', 'FUEL BURN', 'MAX RANGE', 'MAX HOURS'].map(h => (
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
              {rates.map((r, idx) => (
                <tr
                  key={r.type}
                  style={{ borderBottom: idx < rates.length - 1 ? '1px solid #F8F5EF' : 'none' }}
                  onMouseOver={e => e.currentTarget.style.background = '#FDFAF5'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Aircraft type */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                      {r.type}
                    </div>
                  </td>

                  {/* Examples */}
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#888', fontFamily: "'Libre Baskerville', serif", maxWidth: 180 }}>
                    {r.examples}
                  </td>

                  {/* Charter rate — EDITABLE */}
                  <td style={{ padding: '12px 8px' }}>
                    <EditableCell type={r.type} field="aircraftRateUSD" value={r.aircraftRateUSD} prefix="$" suffix="/hr" />
                  </td>

                  {/* Cruise speed — EDITABLE */}
                  <td style={{ padding: '12px 8px' }}>
                    <EditableCell type={r.type} field="cruiseSpeed" value={r.cruiseSpeed} suffix=" km/h" />
                  </td>

                  {/* Fuel burn — EDITABLE */}
                  <td style={{ padding: '12px 8px' }}>
                    <EditableCell type={r.type} field="fuelBurnLph" value={r.fuelBurnLph} suffix=" L/hr" />
                  </td>

                  {/* Max range — EDITABLE */}
                  <td style={{ padding: '12px 8px' }}>
                    <EditableCell type={r.type} field="maxRangeKm" value={r.maxRangeKm} suffix=" km" />
                  </td>

                  {/* Max hours — EDITABLE */}
                  <td style={{ padding: '12px 8px' }}>
                    <EditableCell type={r.type} field="maxFlightHours" value={r.maxFlightHours} suffix=" hrs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── INFO CARD ── */}
      <div style={{
        background: '#FFF8EC', border: '1px solid rgba(255,191,0,0.3)',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <AlertCircle size={18} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            How rate updates work
          </div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, fontFamily: "'Libre Baskerville', serif" }}>
            Changes are saved to the cloud instantly and apply across the entire dashboard — Route Planner quotes will automatically use the updated rates. All team members see the same rates in real-time.
          </div>
        </div>
      </div>

    </div>
  );
}