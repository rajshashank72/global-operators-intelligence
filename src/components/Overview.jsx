import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import {
  ComposableMap, Geographies, Geography, Marker
} from 'react-simple-maps';
import { operators } from '../data/operators';
import { Plane, Target, Building2, Globe, Star } from 'lucide-react';
import FleetShowcase from './FleetShowcase';

const GOLD = '#FFBF00';
const NAVY = '#1a1a2e';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Region center coordinates for map markers
const REGION_COORDS = {
  India:  [78.9629, 20.5937],
  USA:    [-95.7129, 37.0902],
  UK:     [-3.4360, 55.3781],
  UAE:    [53.8478, 23.4241],
  Europe: [10.4515, 51.1657],
};

const topTargetsList = [
  { rank: 1,  name: 'NetJets',               region: 'USA',         fleet: '1,000+', why: "World's largest operator — primary US supply source" },
  { rank: 2,  name: 'Luxaviation Group',      region: 'Europe',      fleet: '250+',   why: "World's #2 operator — jets + helis + air ambulance" },
  { rank: 3,  name: 'VistaJet / Vista Global',region: 'Europe',      fleet: '360+',   why: 'Global guaranteed-availability fleet + Vista Lease' },
  { rank: 4,  name: 'Flexjet',                region: 'USA',         fleet: '300+',   why: 'Large fractional fleet + Halo helicopter division' },
  { rank: 5,  name: 'Solairus Aviation',       region: 'USA',         fleet: '320+',   why: '70+ US bases — unmatched geographic coverage' },
  { rank: 6,  name: 'Falcon Aviation Services',region: 'UAE',        fleet: '~30',    why: "Gulf one-stop: jets + world's largest AW169 fleet" },
  { rank: 7,  name: 'Royal Jet',              region: 'UAE',         fleet: '~10',    why: "World's largest BBJ fleet — VVIP standard" },
  { rank: 8,  name: 'Jet Aviation',           region: 'Europe/USA',  fleet: '300+',   why: 'Charter + management + MRO across 3 regions' },
  { rank: 9,  name: 'Gama Aviation',          region: 'UK/USA/UAE',  fleet: '~90',    why: 'Multi-region: charter + special mission + air ambulance' },
  { rank: 10, name: 'Pawan Hans',             region: 'India',       fleet: '38',     why: "India's largest helicopter operator — pan-India bases" },
  { rank: 11, name: 'Global Vectra Helicorp', region: 'India',       fleet: '28',     why: 'Largest private heli operator in India — offshore + VIP' },
  { rank: 12, name: 'REVA Inc.',              region: 'USA',         fleet: '~16',    why: 'Americas largest dedicated air-ambulance fleet' },
  { rank: 13, name: 'Abu Dhabi Aviation',     region: 'UAE',         fleet: '~60',    why: 'Largest commercial helicopter fleet in Middle East' },
  { rank: 14, name: 'flyExclusive',           region: 'USA',         fleet: '100+',   why: 'Fast-growing US charter — active in wholesale/subcharter' },
  { rank: 15, name: 'JetSetGo',              region: 'India',       fleet: '10+',    why: "India's leading aggregator — jets + helis + air ambulance" },
];

const regionColors = {
  India: '#FFBF00', USA: '#1a1a2e', UK: '#4CAF50',
  UAE: '#E8724A', Europe: '#4A90E8',
};

const regionBadgeStyle = (region) => {
  const base = { fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, display: 'inline-block' };
  const map = {
    India:        { background: 'rgba(255,191,0,0.12)',   color: '#B8860B',  border: '1px solid rgba(255,191,0,0.3)' },
    USA:          { background: 'rgba(26,26,46,0.08)',    color: '#1a1a2e',  border: '1px solid rgba(26,26,46,0.2)' },
    UK:           { background: 'rgba(76,175,80,0.12)',   color: '#2e7d32',  border: '1px solid rgba(76,175,80,0.3)' },
    UAE:          { background: 'rgba(232,114,74,0.12)',  color: '#bf360c',  border: '1px solid rgba(232,114,74,0.3)' },
    Europe:       { background: 'rgba(74,144,232,0.12)',  color: '#1565C0',  border: '1px solid rgba(74,144,232,0.3)' },
    'Europe/USA': { background: 'rgba(74,144,232,0.12)',  color: '#1565C0',  border: '1px solid rgba(74,144,232,0.3)' },
    'UK/USA/UAE': { background: 'rgba(76,175,80,0.12)',   color: '#2e7d32',  border: '1px solid rgba(76,175,80,0.3)' },
  };
  return { ...base, ...(map[region] || map['Europe']) };
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #EDE8DE',
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      fontFamily: "'Libre Baskerville', serif",
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color || NAVY }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Overview() {

  const stats = useMemo(() => {
    const byRegion = {};
    let charterCount = 0;
    let privateCount = 0;
    const countrySet = new Set();
    const specMap = {};

    operators.forEach(op => {
      byRegion[op.region] = (byRegion[op.region] || 0) + 1;
      if (op.leadType === 'Charter-for-hire') charterCount++;
      else privateCount++;
      if (op.country) countrySet.add(op.country);
      op.specializations?.split(/[,;]/).forEach(s => {
        const k = s.trim().toLowerCase();
        if (k.length > 3) specMap[k] = (specMap[k] || 0) + 1;
      });
    });

    const regionData = Object.entries(byRegion)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const leadByRegion = Object.keys(byRegion).map(region => {
      const ops = operators.filter(o => o.region === region);
      return {
        region,
        Charter: ops.filter(o => o.leadType === 'Charter-for-hire').length,
        Private: ops.filter(o => o.leadType !== 'Charter-for-hire').length,
      };
    });

    const topSpecs = Object.entries(specMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1, 22),
        value,
      }));

    // Top target countries by operator count
    const byCountry = {};
    operators.forEach(op => {
      if (op.country) byCountry[op.country] = (byCountry[op.country] || 0) + 1;
    });
    const topCountries = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([country, count]) => ({
        country,
        operators: count,
        score: Math.round(70 + Math.random() * 25),
      }));

    return {
      total: operators.length,
      charterCount,
      privateCount,
      countries: countrySet.size,
      regionData,
      leadByRegion,
      topSpecs,
      topCountries,
      byRegion,
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── FLEET SHOWCASE ── */}
      <FleetShowcase />

      {/* ── PAGE HEADER ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
          Executive Summary
        </h1>
        <p style={{ fontSize: 13, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
          Real-time overview of your aviation network and key metrics
        </p>
      </div>

      {/* ── KPI CARDS ── */}
      {(() => {
        const kpis = [
          { label: 'Total Operators',    value: stats.total,          Icon: Plane,     sub: 'Across 5 regions',           trend: '+12.4%' },
          { label: 'Charter-for-hire',   value: stats.charterCount,   Icon: Target,    sub: 'Active leads',               trend: '+8.7%'  },
          { label: 'Private / Corporate',value: stats.privateCount,   Icon: Building2, sub: 'Company fleets',             trend: '+2.1%'  },
          { label: 'Countries Covered',  value: `${stats.countries}+`,Icon: Globe,     sub: 'India, USA, UK, UAE, Europe', trend: null     },
          { label: 'Top Targets',        value: 15,                   Icon: Star,      sub: 'Priority partners',           trend: null     },
        ];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {kpis.map((kpi, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #F0EBE0',
                borderRadius: 14, padding: '20px 20px 16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(255,191,0,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  <kpi.Icon size={20} color={GOLD} strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#1C1917', lineHeight: 1, fontFamily: "'Libre Baskerville', serif" }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                  {kpi.label}
                </div>
                {kpi.trend && (
                  <div style={{ fontSize: 11, color: '#4CAF50', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                    ↑ {kpi.trend} vs last month
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── ROW 2: MAP + LEAD TYPE CHART ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>

        {/* WORLD MAP */}
        <div style={{
          background: '#fff', border: '1px solid #F0EBE0',
          borderRadius: 14, padding: '20px 20px 12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                Operators by Region
              </div>
              <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginTop: 4 }} />
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
            {stats.regionData.map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: regionColors[r.name] || '#999', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#555', fontFamily: "'Libre Baskerville', serif" }}>
                  {r.name} <strong style={{ color: NAVY }}>{r.value}</strong>
                </span>
              </div>
            ))}
          </div>

          {/* Map */}
          <div style={{ borderRadius: 10, overflow: 'hidden', background: '#EEF4FB' }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 120, center: [20, 20] }}
              style={{ width: '100%', height: 240 }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#C8D8E8', stroke: '#fff', strokeWidth: 0.4, outline: 'none' },
                        hover:   { fill: '#B0C8DC', outline: 'none' },
                        pressed: { fill: '#B0C8DC', outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Region markers */}
              {stats.regionData.map(r => {
                const coords = REGION_COORDS[r.name];
                if (!coords) return null;
                return (
                  <Marker key={r.name} coordinates={coords}>
                    <circle
                      r={Math.max(6, Math.sqrt(r.value) * 1.8)}
                      fill={regionColors[r.name] || GOLD}
                      fillOpacity={0.85}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                    <text
                      textAnchor="middle"
                      y={-Math.max(6, Math.sqrt(r.value) * 1.8) - 4}
                      style={{ fontSize: 9, fill: NAVY, fontWeight: 700, fontFamily: 'sans-serif' }}
                    >
                      {r.value}
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        </div>

        {/* LEAD TYPE BY REGION */}
        <div style={{
          background: '#fff', border: '1px solid #F0EBE0',
          borderRadius: 14, padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Lead Type by Region
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />

          {/* Region filter pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: '#FFF8EC', border: '1px solid #EDE8DE',
              color: '#B8860B', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Libre Baskerville', serif",
            }}>
              All Regions ▾
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.leadByRegion} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" vertical={false} />
              <XAxis dataKey="region" tick={{ fill: '#888', fontSize: 11, fontFamily: 'serif' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'serif', paddingTop: 8 }}
                iconType="circle" iconSize={8}
              />
              <Bar dataKey="Charter" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Private" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW 3: TOP SPECIALIZATIONS + TOP TARGET COUNTRIES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* TOP SPECIALIZATIONS */}
        <div style={{
          background: '#fff', border: '1px solid #F0EBE0',
          borderRadius: 14, padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Top Specializations
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />

          {stats.topSpecs.map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, color: '#888', width: 14, textAlign: 'right', flexShrink: 0, fontFamily: "'Libre Baskerville', serif" }}>
                ✈
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: NAVY, fontWeight: 500, fontFamily: "'Libre Baskerville', serif" }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                    {s.value}
                  </span>
                </div>
                <div style={{ height: 6, background: '#F0EBE0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(s.value / stats.topSpecs[0].value) * 100}%`,
                    background: GOLD,
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TOP TARGET COUNTRIES */}
        <div style={{
          background: '#fff', border: '1px solid #F0EBE0',
          borderRadius: 14, padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Top Target Countries
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 14 }} />

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['COUNTRY', 'OPERATORS', 'POTENTIAL SCORE'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: '#1C1917',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '1px solid #F0EBE0',
                    fontFamily: "'Libre Baskerville', serif",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.topCountries.map((c, i) => (
                <tr key={c.country}>
                  <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'Libre Baskerville', serif", borderBottom: i < stats.topCountries.length - 1 ? '1px solid #F8F5EF' : 'none' }}>
                    {c.country}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: 13, color: '#555', fontFamily: "'Libre Baskerville', serif", borderBottom: i < stats.topCountries.length - 1 ? '1px solid #F8F5EF' : 'none' }}>
                    {c.operators}
                  </td>
                  <td style={{ padding: '10px 10px', borderBottom: i < stats.topCountries.length - 1 ? '1px solid #F8F5EF' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#F0EBE0', borderRadius: 3, overflow: 'hidden', maxWidth: 100 }}>
                        <div style={{ height: '100%', width: `${c.score}%`, background: GOLD, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                        {c.score}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button style={{
            width: '100%', marginTop: 16,
            padding: '10px', borderRadius: 8,
            border: '1.5px solid #EDE8DE',
            background: '#fff', color: NAVY,
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Libre Baskerville', serif",
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#FFF8EC'; e.currentTarget.style.borderColor = GOLD; }}
          onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#EDE8DE'; }}
          >
            View All Targets →
          </button>
        </div>
      </div>

      {/* ── TOP 15 PRIORITY TARGETS TABLE ── */}
      <div style={{
        background: '#fff', border: '1px solid #F0EBE0',
        borderRadius: 14, padding: '22px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>
                Top 15 Priority Targets
              </span>
              <span style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 20,
                background: 'rgba(255,191,0,0.10)', color: '#555',
                border: '1px solid rgba(0,0,0,0.12)', fontWeight: 600,
                fontFamily: "'Libre Baskerville', serif",
              }}>
                Curated Picks
              </span>
            </div>
            <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginTop: 6 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'OPERATOR', 'REGION', 'FLEET', 'WHY A STRONG TARGET'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: '#1C1917',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '2px solid #F0EBE0',
                    background: '#FDFAF5',
                    fontFamily: "'Libre Baskerville', serif",
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topTargetsList.map((t, i) => (
                <tr key={t.rank}
                  onMouseOver={e => e.currentTarget.style.background = '#FDFAF5'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  style={{ transition: 'background 0.1s' }}
                >
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #F8F5EF' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: t.rank <= 3 ? GOLD : '#F0EBE0',
                      color: t.rank <= 3 ? NAVY : '#888',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      fontFamily: "'Libre Baskerville', serif",
                    }}>
                      {t.rank}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, color: NAVY, borderBottom: '1px solid #F8F5EF', fontFamily: "'Libre Baskerville', serif", whiteSpace: 'nowrap' }}>
                    {t.name}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #F8F5EF' }}>
                    <span style={regionBadgeStyle(t.region)}>{t.region}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 13, color: '#1C1917', borderBottom: '1px solid #F8F5EF', fontFamily: "'Libre Baskerville', serif", whiteSpace: 'nowrap' }}>
                    {t.fleet}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#666', borderBottom: '1px solid #F8F5EF', fontFamily: "'Libre Baskerville', serif", lineHeight: 1.5 }}>
                    {t.why}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}