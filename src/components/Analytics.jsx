import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, Treemap } from 'recharts';
import { operators } from '../data/operators';

const GOLD = '#FFBF00';
const COLORS = ['#FFBF00','#E8724A','#4A90E8','#4CAF50','#9B59B6','#E84A9A','#4AE8D0','#E8D04A'];

export default function Analytics() {
  const data = useMemo(() => {
    // Operators by country
    const byCountry = {};
    operators.forEach(op => { byCountry[op.country] = (byCountry[op.country] || 0) + 1; });
    const countryData = Object.entries(byCountry).sort((a,b) => b[1]-a[1]).slice(0, 15).map(([name, value]) => ({ name, value }));

    // Fleet size distribution
    const fleetBuckets = { '1-5': 0, '6-15': 0, '16-30': 0, '31-60': 0, '61-100': 0, '100+': 0, 'Unknown': 0 };
    operators.forEach(op => {
      const fs = parseInt(op.fleetSize);
      if (isNaN(fs) || op.fleetSize.includes('+') && fs > 99) fleetBuckets['100+']++;
      else if (isNaN(fs)) fleetBuckets['Unknown']++;
      else if (fs <= 5) fleetBuckets['1-5']++;
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
      op.specializations.split(/[,;]/).forEach(s => {
        const k = s.trim();
        if (k.length > 4) specMap[k] = (specMap[k] || 0) + 1;
      });
    });
    const specData = Object.entries(specMap).sort((a,b) => b[1]-a[1]).slice(0, 12).map(([name, value]) => ({ name: name.slice(0, 30), value }));

    // Europe breakdown
    const europeCountries = {};
    operators.filter(o => o.region === 'Europe').forEach(op => {
      europeCountries[op.country] = (europeCountries[op.country] || 0) + 1;
    });
    const europeData = Object.entries(europeCountries).sort((a,b) => b[1]-a[1]).map(([name, value]) => ({ name, value }));

    return { countryData, fleetData, leadData, specData, europeData };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ROW 1 */}
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Operators by Country (Top 15)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.countryData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#B89A6A', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#B89A6A', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
              <Bar dataKey="value" fill={GOLD} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Fleet Size Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.fleetData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {data.fleetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Charter vs Private by Region</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.leadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="region" tick={{ fill: '#B89A6A', fontSize: 11 }} />
              <YAxis tick={{ fill: '#B89A6A', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Charter" fill={GOLD} radius={[4,4,0,0]} />
              <Bar dataKey="Private" fill="#E8724A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Europe — Operators by Country</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.europeData}>
              <XAxis dataKey="name" tick={{ fill: '#B89A6A', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#B89A6A', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {data.europeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — SPECIALIZATIONS */}
      <div className="card">
        <div className="section-title">Top Specializations Across All Operators</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.specData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#B89A6A', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#B89A6A', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {data.specData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
