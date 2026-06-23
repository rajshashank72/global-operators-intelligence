import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { operators } from '../data/operators';

const GOLD = '#FFBF00';
const NAVY = '#1a1a2e';
const COLORS = ['#FFBF00', '#1a1a2e', '#4A90E8', '#4CAF50', '#E8724A', '#9B59B6', '#E84A9A', '#4AE8D0'];

const regionColors = {
  India: '#FFBF00', USA: '#1a1a2e', UK: '#4CAF50',
  UAE: '#E8724A', Europe: '#4A90E8',
};

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
        <div key={i} style={{ fontSize: 12, color: p.color || GOLD }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [activeRegion, setActiveRegion] = useState('All');

  const data = useMemo(() => {
    // Operators by country (top 15)
    const byCountry = {};
    operators.forEach(op => { byCountry[op.country] = (byCountry[op.country] || 0) + 1; });
    const countryData = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([name, value]) => ({ name, value }));

    // Fleet size distribution
    const fleetBuckets = { '1-5': 0, '6-15': 0, '16-30': 0, '31-60': 0, '61-100': 0, '100+': 0 };
    operators.forEach(op => {
      const fs = parseInt(op.fleetSize);
      if (isNaN(fs)) return;
      if (fs <= 5) fleetBuckets['1-5']++;
      else if (fs <= 15) fleetBuckets['6-15']++;
      else if (fs <= 30) fleetBuckets['16-30']++;
      else if (fs <= 60) fleetBuckets['31-60']++;
      else if (fs <= 100) fleetBuckets['61-100']++;
      else fleetBuckets['100+']++;
    });
    const fleetData = Object.entries(fleetBuckets).map(([name, value]) => ({ name, value }));

    // Lead type by region
    const regionLeads = {};
    operators.forEach(op => {
      if (!regionLeads[op.region]) regionLeads[op.region] = { Charter: 0, Private: 0 };
      if (op.leadType === 'Charter-for-hire') regionLeads[op.region].Charter++;
      else regionLeads[op.region].Private++;
    });
    const leadData = Object.entries(regionLeads).map(([region, v]) => ({ region, ...v }));

    // Top specializations
    const specMap = {};
    operators.forEach(op => {
      op.specializations?.split(/[,;]/).forEach(s => {
        const k = s.trim();
        if (k.length > 4) specMap[k] = (specMap[k] || 0) + 1;
      });
    });
    const specData = Object.entries(specMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name: name.slice(0, 28), value }));

    // Europe breakdown
    const europeData = {};
    operators.filter(o => o.region === 'Europe').forEach(op => {
      europeData[op.country] = (europeData[op.country] || 0) + 1;
    });
    const europeChartData = Object.entries(europeData)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Region summary
    const byRegion = {};
    operators.forEach(op => { byRegion[op.region] = (byRegion[op.region] || 0) + 1; });
    const regionData = Object.entries(byRegion).map(([name, value]) => ({ name, value }));

    // Charter vs Private overall
    const charter = operators.filter(o => o.leadType === 'Charter-for-hire').length;
    const pvt = operators.length - charter;
    const leadTypeData = [
      { name: 'Charter-for-hire', value: charter },
      { name: 'Private/Corporate', value: pvt },
    ];

    return { countryData, fleetData, leadData, specData, europeChartData, regionData, leadTypeData };
  }, []);

  // KPI summary
  const kpis = useMemo(() => {
    const charter = operators.filter(o => o.leadType === 'Charter-for-hire').length;
    const regions = new Set(operators.map(o => o.region)).size;
    const countries = new Set(operators.map(o => o.country)).size;
    const avgFleet = Math.round(
      operators.reduce((sum, o) => sum + (parseInt(o.fleetSize) || 0), 0) / operators.length
    );
    return { charter, regions, countries, avgFleet };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── PAGE HEADER ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
          Analytics
        </h1>
        <p style={{ fontSize: 13, color: '#888', fontFamily: "'Libre Baskerville', serif" }}>
          Deep dive into operator intelligence across all regions
        </p>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Operators',    value: operators.length, color: '#1C1917' },
          { label: 'Charter Operators',  value: kpis.charter,     color: '#4CAF50' },
          { label: 'Countries Covered',  value: kpis.countries,   color: '#4A90E8' },
          { label: 'Avg Fleet Size',     value: kpis.avgFleet,    color: '#E8724A' },
        ].map((k, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #F0EBE0',
            borderRadius: 14, padding: '18px 22px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: "'Libre Baskerville', serif", lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 6, fontFamily: "'Libre Baskerville', serif" }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 1: Operators by Country + Fleet Size ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>

        {/* Operators by Country */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Operators by Country
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.countryData} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#555', fontSize: 11, fontFamily: 'serif' }} width={120} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={GOLD} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Size Distribution */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Fleet Size Distribution
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.fleetData}
                cx="50%" cy="45%"
                outerRadius={95}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {data.fleetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW 2: Charter vs Private + Europe Breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Charter vs Private by Region */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Charter vs Private by Region
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.leadData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" vertical={false} />
              <XAxis dataKey="region" tick={{ fill: '#888', fontSize: 11, fontFamily: 'serif' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'serif', paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Charter" fill={GOLD} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Private" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Europe Breakdown */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Europe — Operators by Country
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.europeChartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10, fontFamily: 'serif' }} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.europeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW 3: Top Specializations + Lead Type Pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

        {/* Top Specializations */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Top Specializations
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />

          {data.specData.map((s, i) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,191,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1C1917' }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: NAVY, fontWeight: 500, fontFamily: "'Libre Baskerville', serif" }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>{s.value}</span>
                </div>
                <div style={{ height: 6, background: '#F0EBE0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(s.value / data.specData[0].value) * 100}%`,
                    background: COLORS[i % COLORS.length],
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lead Type Overall */}
        <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
            Lead Type Split
          </div>
          <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 16 }} />

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.leadTypeData}
                cx="50%" cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={3}
              >
                <Cell fill={GOLD} />
                <Cell fill={NAVY} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {data.leadTypeData.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? GOLD : NAVY, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#555', fontFamily: "'Libre Baskerville', serif" }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: "'Libre Baskerville', serif" }}>{item.value}</span>
                  <span style={{ fontSize: 11, color: '#aaa', fontFamily: "'Libre Baskerville', serif" }}>
                    ({Math.round((item.value / operators.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 4: Region Summary Cards ── */}
      <div style={{ background: '#fff', border: '1px solid #F0EBE0', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4, fontFamily: "'Libre Baskerville', serif" }}>
          Region Summary
        </div>
        <div style={{ width: 36, height: 2, background: GOLD, borderRadius: 2, marginBottom: 20 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {data.regionData.sort((a, b) => b.value - a.value).map((r) => {
            const charter = operators.filter(o => o.region === r.name && o.leadType === 'Charter-for-hire').length;
            const pct = Math.round((charter / r.value) * 100);
            return (
              <div key={r.name} style={{
                background: '#FDFAF5', border: '1px solid #F0EBE0',
                borderRadius: 12, padding: '16px',
                borderTop: `3px solid ${regionColors[r.name] || GOLD}`,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1C1917', fontFamily: "'Libre Baskerville', serif", lineHeight: 1 }}>
                  {r.value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginTop: 4, fontFamily: "'Libre Baskerville', serif" }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 6, fontFamily: "'Libre Baskerville', serif" }}>
                  {pct}% charter
                </div>
                <div style={{ height: 4, background: '#F0EBE0', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(r.value / operators.length) * 100}%`,
                    background: regionColors[r.name] || GOLD,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}