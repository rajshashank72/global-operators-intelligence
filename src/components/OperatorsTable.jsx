import React, { useState, useMemo, useRef, useEffect } from 'react';
import { operators } from '../data/operators';

const GOLD = '#FFBF00';

const countryColors = {
  'India': { bg: 'rgba(201,165,53,0.15)', color: '#A07C20', border: '#FFBF00' },
  'USA': { bg: 'rgba(74,144,232,0.15)', color: '#1A5FAD', border: '#4A90E8' },
  'United States': { bg: 'rgba(74,144,232,0.15)', color: '#1A5FAD', border: '#4A90E8' },
  'United Kingdom': { bg: 'rgba(76,175,80,0.15)', color: '#2E7D32', border: '#4CAF50' },
  'UAE': { bg: 'rgba(232,114,74,0.15)', color: '#BF360C', border: '#E8724A' },
  'Belgium': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Germany': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'France': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Switzerland': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Luxembourg': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Malta': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Austria': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Italy': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Spain': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Netherlands': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
  'Portugal': { bg: 'rgba(155,89,182,0.15)', color: '#6A1B9A', border: '#9B59B6' },
};

function getCountryStyle(country) {
  return countryColors[country] || { bg: 'rgba(136,135,128,0.15)', color: '#444', border: '#888' };
}

const topByCountry = {};
operators.forEach(op => {
  const key = op.country;
  const fs = parseInt(op.fleetSize) || 0;
  if (!topByCountry[key] || fs > (parseInt(topByCountry[key].fleetSize) || 0)) {
    topByCountry[key] = op;
  }
});
const topIds = new Set(Object.values(topByCountry).map(o => o.id));

const allRegions = ['All', 'India', 'USA', 'UK', 'UAE', 'Europe'];
const allLeadTypes = ['All', 'Charter-for-hire', 'Private/Corporate'];
const europeCountries = [...new Set(operators.filter(o => o.region === 'Europe').map(o => o.country))].sort();

// Aircraft tooltip component
function AircraftTooltip({ fleetTypes, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const types = fleetTypes
    .replace(/\[.*?\]/g, '')
    .split(/[,;|\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  return (
    <div ref={ref} style={{
      position: 'absolute', zIndex: 1000, right: 0, top: '110%',
      background: '#FFFFFF', border: '1px solid #D4C4A0',
      borderRadius: 10, padding: '12px 14px', minWidth: 220, maxWidth: 300,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: '#1C1208', marginBottom: 8, borderBottom: '1px solid #F0EAD6', paddingBottom: 6 }}>
        ✈️ Fleet Types
      </div>
      {types.length > 0 ? types.map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: '#333', padding: '4px 0', borderBottom: i < types.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
          • {t}
        </div>
      )) : (
        <div style={{ fontSize: 12, color: '#888' }}>No fleet info available</div>
      )}
    </div>
  );
}

function OperatorModal({ op, onClose }) {
  if (!op) return null;
  const website = op.website ? (op.website.startsWith('http') ? op.website : 'https://' + op.website) : null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 6 }}>{op.name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{op.region}</span>
              <span className="badge badge-gold">{op.country}</span>
              {op.leadType === 'Charter-for-hire' ? <span className="badge badge-green">Charter-for-hire</span> : <span className="badge badge-coral">Private/Corporate</span>}
              {op.isTopTarget && <span className="badge badge-gold">⭐ Top Target</span>}
              {topIds.has(op.id) && <span className="badge badge-gold">🏆 Top in {op.country}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: GOLD }}>✕</button>
        </div>
        {[
          ['📍 City', op.city],
          ['🏢 Address', op.address],
          ['✈️ Main Bases', op.bases],
          ['📞 Phone', op.phone],
          ['✈️ Fleet Size', op.fleetSize],
          ['🛩️ Fleet Types', op.fleetTypes],
          ['🎯 Specializations', op.specializations],
          ['📋 Source', op.source],
        ].map(([label, val]) => val && val !== 'None' && (
          <div key={label} style={{ marginBottom: 12, borderBottom: '1px solid rgba(201,165,53,0.1)', paddingBottom: 10 }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13 }}>{val}</div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {op.email && op.email !== 'Not Found' && (
            <a href={`mailto:${op.email}`} className="btn-gold" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>📧 Email</a>
          )}
          {website && op.website !== 'Not Found' && (
            <a href={website} target="_blank" rel="noreferrer" className="btn-outline" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 500, fontSize: 13 }}>🌐 Website</a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperatorsTable() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [country, setCountry] = useState('All');
  const [leadType, setLeadType] = useState('All');
  const [specFilter, setSpecFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedOp, setSelectedOp] = useState(null);
  const [openAircraftId, setOpenAircraftId] = useState(null);
  const PAGE_SIZE = 20;

  const allSpecs = useMemo(() => {
    const s = new Set();
    operators.forEach(op => {
      op.specializations.split(/[,;]/).forEach(spec => {
        const k = spec.trim();
        if (k.length > 3) s.add(k.toLowerCase().replace(/^\w/, c => c.toUpperCase()));
      });
    });
    return ['All', ...Array.from(s).sort().slice(0, 30)];
  }, []);

  const filtered = useMemo(() => {
    let data = operators;
    if (search) data = data.filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      o.country.toLowerCase().includes(search.toLowerCase())
    );
    if (region !== 'All') data = data.filter(o => o.region === region);
    if (region === 'Europe' && country !== 'All') data = data.filter(o => o.country === country);
    if (leadType !== 'All') data = data.filter(o => leadType === 'Charter-for-hire' ? o.leadType === 'Charter-for-hire' : o.leadType !== 'Charter-for-hire');
    if (specFilter && specFilter !== 'All') data = data.filter(o => o.specializations.toLowerCase().includes(specFilter.toLowerCase()));
    return [...data].sort((a, b) => {
      let av = a[sortField] || '', bv = b[sortField] || '';
      if (sortField === 'fleetSize') { av = parseInt(av) || 0; bv = parseInt(bv) || 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [search, region, country, leadType, specFilter, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => <span style={{ opacity: 0.5 }}>{sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>;

  return (
    <div>
      {selectedOp && <OperatorModal op={selectedOp} onClose={() => setSelectedOp(null)} />}

      {/* FILTERS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="🔍 Search operator, city, country..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: '1 1 220px' }} />
          <select value={region} onChange={e => { setRegion(e.target.value); setCountry('All'); setPage(1); }}>
            {allRegions.map(r => <option key={r} value={r}>{r === 'All' ? '🌍 All Regions' : r}</option>)}
          </select>
          {region === 'Europe' && (
            <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }}>
              <option value="All">All Countries</option>
              {europeCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select value={leadType} onChange={e => { setLeadType(e.target.value); setPage(1); }}>
            {allLeadTypes.map(t => <option key={t} value={t}>{t === 'All' ? '📋 All Lead Types' : t}</option>)}
          </select>
          <select value={specFilter} onChange={e => { setSpecFilter(e.target.value); setPage(1); }}>
            {allSpecs.map(s => <option key={s} value={s}>{s === 'All' ? '🎯 All Specializations' : s}</option>)}
          </select>
          <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>{filtered.length} operators</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Operator <SortIcon field="name" /></th>
                <th onClick={() => handleSort('country')} style={{ cursor: 'pointer' }}>Country <SortIcon field="country" /></th>
                <th onClick={() => handleSort('city')} style={{ cursor: 'pointer' }}>City <SortIcon field="city" /></th>
                <th onClick={() => handleSort('fleetSize')} style={{ cursor: 'pointer' }}>Fleet <SortIcon field="fleetSize" /></th>
                <th>Aircrafts</th>
                <th>Lead Type</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(op => {
                const isTop = topIds.has(op.id);
                const cs = getCountryStyle(op.country);
                const website = op.website ? (op.website.startsWith('http') ? op.website : 'https://' + op.website) : null;
                return (
                  <tr key={op.id} onClick={() => setSelectedOp(op)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {op.isTopTarget && <span title="Top 15 Target">⭐</span>}
                        {isTop && <span title={`Top operator in ${op.country}`}>🏆</span>}
                        <span style={{ fontWeight: 600 }}>{op.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
                        {op.country}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{op.city}</td>
                    <td style={{ color: GOLD, fontWeight: 600 }}>{op.fleetSize}</td>
                    <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenAircraftId(openAircraftId === op.id ? null : op.id)}
                        title="View aircraft types"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 6px', borderRadius: 6, transition: 'background 0.15s' }}
                      >
                        ✈️
                      </button>
                      {openAircraftId === op.id && (
                        <AircraftTooltip
                          fleetTypes={op.fleetTypes}
                          onClose={() => setOpenAircraftId(null)}
                        />
                      )}
                    </td>
                    <td>
                      {op.leadType === 'Charter-for-hire'
                        ? <span className="badge badge-green">Charter</span>
                        : <span className="badge badge-coral">Private</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                      {op.email && op.email !== 'Not Found' && (
                        <a href={`mailto:${op.email}`} title={op.email} style={{ color: GOLD, marginRight: 10, fontSize: 16, textDecoration: 'none' }}>📧</a>
                      )}
                      {website && op.website !== 'Not Found' && (
                        <a href={website} target="_blank" rel="noreferrer" title={op.website} style={{ color: '#4A90E8', fontSize: 16, textDecoration: 'none' }}>🌐</a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid rgba(201,165,53,0.15)' }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} style={{ padding: '7px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: p === page ? GOLD : 'transparent', color: p === page ? '#1C1208' : GOLD, fontWeight: p === page ? 700 : 400 }}>{p}</button>
              );
            })}
            <button className="btn-outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
