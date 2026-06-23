import React, { useState, useMemo, useRef, useEffect } from 'react';
import { operators } from '../data/operators';
import { Search, Globe, Mail, MoreVertical, Plane, RotateCcw, Download, Star } from 'lucide-react';

const GOLD = '#FFBF00';
const NAVY = '#1a1a2e';

const countryColors = {
  'India':          { bg: 'rgba(255,191,0,0.12)',   color: '#1C1917', border: 'rgba(255,191,0,0.35)' },
  'USA':            { bg: 'rgba(26,26,46,0.07)',     color: '#1a1a2e', border: 'rgba(26,26,46,0.2)' },
  'United States':  { bg: 'rgba(26,26,46,0.07)',     color: '#1a1a2e', border: 'rgba(26,26,46,0.2)' },
  'United Kingdom': { bg: 'rgba(76,175,80,0.12)',    color: '#2e7d32', border: 'rgba(76,175,80,0.3)' },
  'UAE':            { bg: 'rgba(232,114,74,0.12)',   color: '#bf360c', border: 'rgba(232,114,74,0.3)' },
  'Belgium':        { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Germany':        { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'France':         { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Switzerland':    { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Luxembourg':     { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Malta':          { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Austria':        { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Italy':          { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Spain':          { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Netherlands':    { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
  'Portugal':       { bg: 'rgba(74,144,232,0.12)',   color: '#1565C0', border: 'rgba(74,144,232,0.3)' },
};

function getCountryStyle(country) {
  return countryColors[country] || { bg: 'rgba(136,135,128,0.12)', color: '#555', border: 'rgba(136,135,128,0.3)' };
}

const topByCountry = {};
operators.forEach(op => {
  const fs = parseInt(op.fleetSize) || 0;
  if (!topByCountry[op.country] || fs > (parseInt(topByCountry[op.country].fleetSize) || 0)) {
    topByCountry[op.country] = op;
  }
});
const topIds = new Set(Object.values(topByCountry).map(o => o.id));

const allRegions = ['All', 'India', 'USA', 'UK', 'UAE', 'Europe'];
const allLeadTypes = ['All', 'Charter-for-hire', 'Private/Corporate'];
const europeCountries = [...new Set(operators.filter(o => o.region === 'Europe').map(o => o.country))].sort();

// ── Aircraft tooltip ──────────────────────────────────────
function AircraftTooltip({ fleetTypes, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const types = fleetTypes
    ?.replace(/\[.*?\]/g, '')
    .split(/[,;|\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 2) || [];

  return (
    <div ref={ref} style={{
      position: 'absolute', zIndex: 2000, right: 0, top: '110%',
      background: '#FFFFFF', border: '1px solid #EDE8DE',
      borderRadius: 10, padding: '12px 14px',
      minWidth: 220, maxWidth: 300,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontFamily: "'Libre Baskerville', serif",
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: NAVY, marginBottom: 8, borderBottom: '1px solid #F0EBE0', paddingBottom: 6 }}>
        ✈ Fleet Types
      </div>
      {types.length > 0 ? types.map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: '#444', padding: '5px 0', borderBottom: i < types.length - 1 ? '1px solid #F8F5EF' : 'none' }}>
          · {t}
        </div>
      )) : (
        <div style={{ fontSize: 12, color: '#aaa' }}>No fleet info available</div>
      )}
    </div>
  );
}

// ── Three-dot menu ────────────────────────────────────────
function ThreeDotMenu({ op, onViewDetails }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const website = op.website && op.website !== 'Not Found'
    ? (op.website.startsWith('http') ? op.website : 'https://' + op.website)
    : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 8px', borderRadius: 6, fontSize: 16,
          color: '#bbb', transition: 'all 0.15s',
          display: 'flex', flexDirection: 'column', gap: 3,
          alignItems: 'center', justifyContent: 'center',
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#F8F5EF'; e.currentTarget.style.color = '#555'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bbb'; }}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%',
          background: '#fff', border: '1px solid #EDE8DE',
          borderRadius: 10, minWidth: 160, zIndex: 2000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          overflow: 'hidden',
          fontFamily: "'Libre Baskerville', serif",
        }}>
          <div
            onClick={e => { e.stopPropagation(); onViewDetails(); setOpen(false); }}
            style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: NAVY, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F0EBE0' }}
            onMouseOver={e => e.currentTarget.style.background = '#FFF8EC'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            📋 View Details
          </div>
          {op.email && op.email !== 'Not Found' && (
            <a
              href={`mailto:${op.email}`}
              onClick={e => e.stopPropagation()}
              style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: NAVY, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', borderBottom: '1px solid #F0EBE0' }}
              onMouseOver={e => e.currentTarget.style.background = '#FFF8EC'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              📧 Send Email
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: NAVY, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
              onMouseOver={e => e.currentTarget.style.background = '#FFF8EC'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              🌐 Visit Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────
function OperatorModal({ op, onClose }) {
  if (!op) return null;
  const website = op.website && op.website !== 'Not Found'
    ? (op.website.startsWith('http') ? op.website : 'https://' + op.website)
    : null;
  const cs = getCountryStyle(op.country);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8, fontFamily: "'Libre Baskerville', serif" }}>
              {op.isTopTarget && <span style={{ marginRight: 6 }}>⭐</span>}
              {op.name}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ ...badgeStyle, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{op.country}</span>
              {op.leadType === 'Charter-for-hire'
                ? <span style={{ ...badgeStyle, background: 'rgba(76,175,80,0.12)', color: '#2e7d32', border: '1px solid rgba(76,175,80,0.3)' }}>Charter-for-hire</span>
                : <span style={{ ...badgeStyle, background: 'rgba(232,114,74,0.12)', color: '#bf360c', border: '1px solid rgba(232,114,74,0.3)' }}>Private/Corporate</span>
              }
              {topIds.has(op.id) && (
                <span style={{ ...badgeStyle, background: 'rgba(255,191,0,0.12)', color: '#B8860B', border: '1px solid rgba(255,191,0,0.3)' }}>🏆 Top in {op.country}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', padding: 4, borderRadius: 6, lineHeight: 1 }}
            onMouseOver={e => e.currentTarget.style.color = NAVY}
            onMouseOut={e => e.currentTarget.style.color = '#aaa'}
          >✕</button>
        </div>

        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          {[
            ['📍 City', op.city],
            ['✈ Fleet Size', op.fleetSize ? op.fleetSize.toString().replace(/[~-]/g, '') : null],
            ['🏢 Address', op.address],
            ['📞 Phone', op.phone],
            ['✈ Main Bases', op.bases],
            ['📋 Source', op.source],
          ].map(([label, val]) => val && val !== 'None' && val !== 'Not Found' && (
            <div key={label} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F0EBE0' }}>
              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3, fontFamily: "'Libre Baskerville', serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Fleet types */}
        {op.fleetTypes && op.fleetTypes !== 'Not Found' && (
          <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F0EBE0' }}>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6, fontFamily: "'Libre Baskerville', serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>✈ Fleet Types</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {op.fleetTypes.replace(/\[.*?\]/g, '').split(/[,;|\n]/).map(s => s.trim()).filter(s => s.length > 2).map((t, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF8EC', color: '#B8860B', border: '1px solid rgba(255,191,0,0.3)', fontFamily: "'Libre Baskerville', serif" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specializations */}
        {op.specializations && op.specializations !== 'Not Found' && (
          <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #F0EBE0' }}>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6, fontFamily: "'Libre Baskerville', serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Specializations</div>
            <div style={{ fontSize: 13, color: '#555', fontFamily: "'Libre Baskerville', serif" }}>{op.specializations}</div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {op.email && op.email !== 'Not Found' && (
            <a href={`mailto:${op.email}`} style={{
              background: GOLD, color: NAVY, textDecoration: 'none',
              padding: '9px 18px', borderRadius: 8, fontWeight: 700,
              fontSize: 13, fontFamily: "'Libre Baskerville', serif",
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              📧 Send Email
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noreferrer" style={{
              background: 'transparent', color: NAVY, textDecoration: 'none',
              padding: '9px 18px', borderRadius: 8, fontWeight: 600,
              fontSize: 13, fontFamily: "'Libre Baskerville', serif",
              border: '1.5px solid #EDE8DE',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = '#FFF8EC'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#EDE8DE'; e.currentTarget.style.background = 'transparent'; }}
            >
              🌐 Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const badgeStyle = {
  fontSize: 11, fontWeight: 600,
  padding: '3px 10px', borderRadius: 20,
  display: 'inline-block', fontFamily: "'Libre Baskerville', serif",
};

// ── Main Component ────────────────────────────────────────
export default function OperatorsTable() {
  const [search, setSearch]           = useState('');
  const [region, setRegion]           = useState('All');
  const [country, setCountry]         = useState('All');
  const [leadType, setLeadType]       = useState('All');
  const [specFilter, setSpecFilter]   = useState('All');
  const [sortField, setSortField]     = useState('name');
  const [sortDir, setSortDir]         = useState('asc');
  const [page, setPage]               = useState(1);
  const [selectedOp, setSelectedOp]   = useState(null);
  const [openAircraftId, setOpenAircraftId] = useState(null);
  const PAGE_SIZE = 20;

  const allSpecs = useMemo(() => {
    const s = new Set();
    operators.forEach(op => {
      op.specializations?.split(/[,;]/).forEach(spec => {
        const k = spec.trim();
        if (k.length > 3) s.add(k.toLowerCase().replace(/^\w/, c => c.toUpperCase()));
      });
    });
    return ['All', ...Array.from(s).sort().slice(0, 30)];
  }, []);

  const filtered = useMemo(() => {
    let data = operators;
    if (search) data = data.filter(o =>
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.city?.toLowerCase().includes(search.toLowerCase()) ||
      o.country?.toLowerCase().includes(search.toLowerCase())
    );
    if (region !== 'All') data = data.filter(o => o.region === region);
    if (region === 'Europe' && country !== 'All') data = data.filter(o => o.country === country);
    if (leadType !== 'All') data = data.filter(o =>
      leadType === 'Charter-for-hire' ? o.leadType === 'Charter-for-hire' : o.leadType !== 'Charter-for-hire'
    );
    if (specFilter !== 'All') data = data.filter(o =>
      o.specializations?.toLowerCase().includes(specFilter.toLowerCase())
    );
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
    setPage(1);
  };

  const SortIcon = ({ field }) => (
    <span style={{ opacity: 0.4, fontSize: 10, marginLeft: 4 }}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {selectedOp && <OperatorModal op={selectedOp} onClose={() => setSelectedOp(null)} />}

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Operators
          </h1>
          <p style={{ fontSize: 13, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
            Manage and explore global aviation operators
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: GOLD, border: 'none',
            color: NAVY, fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: "'Libre Baskerville', serif",
          }}>
            + Add Operator
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: '#fff', border: '1px solid #EDE8DE',
            color: NAVY, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: "'Libre Baskerville', serif",
          }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{
        background: '#fff', border: '1px solid #F0EBE0',
        borderRadius: 12, padding: '14px 18px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F5EF', border: '1px solid #EDE8DE', borderRadius: 8, padding: '8px 12px', flex: '1 1 220px', minWidth: 200 }}>
          <span style={{ color: '#bbb', display: 'flex', alignItems: 'center', flexShrink: 0 }}><Search size={14} /></span>
          <input
            placeholder="Search operator, city, country..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#333', outline: 'none', width: '100%', fontFamily: "'Libre Baskerville', serif" }}
          />
        </div>

        {/* Region */}
        <div style={{ position: 'relative' }}>
          <select
            value={region}
            onChange={e => { setRegion(e.target.value); setCountry('All'); setPage(1); }}
            style={{ padding: '8px 32px 8px 12px', borderRadius: 8, border: '1px solid #EDE8DE', background: '#fff', fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif", appearance: 'none', cursor: 'pointer' }}
          >
            {allRegions.map(r => <option key={r} value={r}>{r === 'All' ? '🌍 All Regions' : r}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: GOLD }}>▼</span>
        </div>

        {/* Europe country */}
        {region === 'Europe' && (
          <div style={{ position: 'relative' }}>
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setPage(1); }}
              style={{ padding: '8px 32px 8px 12px', borderRadius: 8, border: '1px solid #EDE8DE', background: '#fff', fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif", appearance: 'none', cursor: 'pointer' }}
            >
              <option value="All">All Countries</option>
              {europeCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: GOLD }}>▼</span>
          </div>
        )}

        {/* Lead type */}
        <div style={{ position: 'relative' }}>
          <select
            value={leadType}
            onChange={e => { setLeadType(e.target.value); setPage(1); }}
            style={{ padding: '8px 32px 8px 12px', borderRadius: 8, border: '1px solid #EDE8DE', background: '#fff', fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif", appearance: 'none', cursor: 'pointer' }}
          >
            {allLeadTypes.map(t => <option key={t} value={t}>{t === 'All' ? '📋 All Lead Types' : t}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: GOLD }}>▼</span>
        </div>

        {/* Specializations */}
        <div style={{ position: 'relative' }}>
          <select
            value={specFilter}
            onChange={e => { setSpecFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 32px 8px 12px', borderRadius: 8, border: '1px solid #EDE8DE', background: '#fff', fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif", appearance: 'none', cursor: 'pointer' }}
          >
            {allSpecs.map(s => <option key={s} value={s}>{s === 'All' ? '🎯 All Specializations' : s}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: GOLD }}>▼</span>
        </div>

        {/* Count + Reset */}
        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Libre Baskerville', serif", marginLeft: 4 }}>
          {filtered.length} operators found
        </span>
        {(search || region !== 'All' || leadType !== 'All' || specFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setRegion('All'); setCountry('All'); setLeadType('All'); setSpecFilter('All'); setPage(1); }}
            style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Libre Baskerville', serif", display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
        )}
      </div>

      {/* ── TABLE ── */}
      <div style={{
        background: '#fff', border: '1px solid #F0EBE0',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'OPERATOR', field: 'name' },
                  { label: 'COUNTRY', field: 'country' },
                  { label: 'CITY', field: 'city' },
                  { label: 'FLEET', field: 'fleetSize' },
                  { label: 'AIRCRAFTS', field: null },
                  { label: 'LEAD TYPE', field: null },
                  { label: 'CONTACT', field: null },
                  { label: '', field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={field ? () => handleSort(field) : undefined}
                    style={{
                      padding: '13px 16px',
                      textAlign: 'left',
                      fontSize: 10, fontWeight: 700,
                      color: '#B8860B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      borderBottom: '1px solid #F0EBE0',
                      background: '#FDFAF5',
                      cursor: field ? 'pointer' : 'default',
                      fontFamily: "'Libre Baskerville', serif",
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {label}{field && <SortIcon field={field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((op, idx) => {
                const isTop = topIds.has(op.id);
                const cs = getCountryStyle(op.country);
                const website = op.website && op.website !== 'Not Found'
                  ? (op.website.startsWith('http') ? op.website : 'https://' + op.website)
                  : null;

                return (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOp(op)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: idx < paginated.length - 1 ? '1px solid #F8F5EF' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#FDFAF5'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Operator name */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {op.isTopTarget && (
                          <span title="Top 15 Target" style={{ display: 'flex' }}><Star size={13} color={GOLD} fill={GOLD} /></span>
                        )}
                        {isTop && (
                          <span title={`Top operator in ${op.country}`} style={{ display: 'flex' }}><Star size={13} color="#4A90E8" fill="#4A90E8" /></span>
                        )}
                        <span style={{ fontWeight: 600, fontSize: 13, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                          {op.name}
                        </span>
                      </div>
                    </td>

                    {/* Country badge */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600,
                        background: cs.bg, color: cs.color,
                        border: `1px solid ${cs.border}`,
                        fontFamily: "'Libre Baskerville', serif",
                        whiteSpace: 'nowrap',
                      }}>
                        {op.country}
                      </span>
                    </td>

                    {/* City */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#555', fontFamily: "'Libre Baskerville', serif" }}>
                      {op.city}
                    </td>

                    {/* Fleet size */}
                    <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 13, color: GOLD, fontFamily: "'Libre Baskerville', serif" }}>
                      {op.fleetSize ? op.fleetSize.toString().replace(/[~-]/g, '') : '—'}
                    </td>

                    {/* Aircraft icon */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '13px 16px', position: 'relative' }}>
                      <button
                        onClick={() => setOpenAircraftId(openAircraftId === op.id ? null : op.id)}
                        title="View aircraft types"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 16, padding: '3px 7px', borderRadius: 6,
                          transition: 'background 0.15s', color: '#888',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#F8F5EF'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <Plane size={15} color="#888" />
                        </button>
                      {openAircraftId === op.id && (
                        <AircraftTooltip
                          fleetTypes={op.fleetTypes}
                          onClose={() => setOpenAircraftId(null)}
                        />
                      )}
                    </td>

                    {/* Lead type badge */}
                    <td style={{ padding: '13px 16px' }}>
                      {op.leadType === 'Charter-for-hire' ? (
                        <span style={{ ...badgeStyle, background: 'rgba(76,175,80,0.12)', color: '#2e7d32', border: '1px solid rgba(76,175,80,0.3)' }}>
                          Charter
                        </span>
                      ) : (
                        <span style={{ ...badgeStyle, background: 'rgba(232,114,74,0.12)', color: '#bf360c', border: '1px solid rgba(232,114,74,0.3)' }}>
                          Private
                        </span>
                      )}
                    </td>

                    {/* Contact icons */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      {op.email && op.email !== 'Not Found' && (
                        <a
                          href={`mailto:${op.email}`}
                          title={op.email}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 6,
                            background: '#F8F5EF', border: '1px solid #EDE8DE',
                            fontSize: 13, textDecoration: 'none',
                            marginRight: 6, transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#FFF8EC'; e.currentTarget.style.borderColor = GOLD; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#F8F5EF'; e.currentTarget.style.borderColor = '#EDE8DE'; }}
                        >
                          <Mail size={13} color={GOLD} />
                        </a>
                      )}
                      {website && (
                        <a
                          href={website}
                          target="_blank"
                          rel="noreferrer"
                          title={op.website}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 6,
                            background: '#F8F5EF', border: '1px solid #EDE8DE',
                            fontSize: 13, textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#EEF4FB'; e.currentTarget.style.borderColor = '#4A90E8'; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#F8F5EF'; e.currentTarget.style.borderColor = '#EDE8DE'; }}
                        >
                          <Globe size={13} color="#4A90E8" />
                        </a>
                      )}
                    </td>

                    {/* Three-dot menu */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '13px 10px' }}>
                      <ThreeDotMenu op={op} onViewDetails={() => setSelectedOp(op)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px',
          borderTop: '1px solid #F0EBE0',
          background: '#FDFAF5',
        }}>
          <span style={{ fontSize: 12, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} operators
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid #EDE8DE',
                background: page === 1 ? '#F8F5EF' : '#fff',
                color: page === 1 ? '#ccc' : NAVY,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: 13, fontFamily: "'Libre Baskerville', serif",
              }}
            >‹</button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    border: p === page ? 'none' : '1px solid #EDE8DE',
                    background: p === page ? GOLD : '#fff',
                    color: p === page ? NAVY : '#555',
                    fontWeight: p === page ? 700 : 400,
                    cursor: 'pointer', fontSize: 13,
                    fontFamily: "'Libre Baskerville', serif",
                  }}
                >
                  {p}
                </button>
              );
            })}

            {totalPages > 5 && page < totalPages - 2 && (
              <>
                <span style={{ color: '#aaa', padding: '0 4px' }}>...</span>
                <button onClick={() => setPage(totalPages)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #EDE8DE', background: '#fff', color: '#555', cursor: 'pointer', fontSize: 13 }}>{totalPages}</button>
              </>
            )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid #EDE8DE',
                background: page === totalPages ? '#F8F5EF' : '#fff',
                color: page === totalPages ? '#ccc' : NAVY,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 13, fontFamily: "'Libre Baskerville', serif",
              }}
            >›</button>
          </div>

          {/* Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>Rows per page</span>
            <select
              value={PAGE_SIZE}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #EDE8DE', fontSize: 12, fontFamily: "'Libre Baskerville', serif", color: NAVY }}
              readOnly
            >
              <option>20</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}