import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { operators } from '../data/operators';

const GOLD = '#FFBF00';
const CORAL = '#E8724A';
const COLORS = ['#FFBF00','#E8724A','#4A90E8','#4CAF50','#9B59B6'];

const topTargetsList = [
  { rank: 1, name: 'NetJets', region: 'USA', fleet: '1,000+', why: 'World\'s largest operator — primary US supply source' },
  { rank: 2, name: 'Luxaviation Group', region: 'Europe', fleet: '250+', why: 'World\'s #2 operator — jets + helis + air ambulance' },
  { rank: 3, name: 'VistaJet / Vista Global', region: 'Europe', fleet: '360+', why: 'Global guaranteed-availability fleet + Vista Lease' },
  { rank: 4, name: 'Flexjet', region: 'USA', fleet: '300+', why: 'Large fractional fleet + Halo helicopter division' },
  { rank: 5, name: 'Solairus Aviation', region: 'USA', fleet: '320+', why: '70+ US bases — unmatched geographic coverage' },
  { rank: 6, name: 'Falcon Aviation Services', region: 'UAE', fleet: '~30', why: 'Gulf one-stop: jets + world\'s largest AW169 fleet + air ambulance' },
  { rank: 7, name: 'Royal Jet', region: 'UAE', fleet: '~10', why: 'World\'s largest BBJ fleet — VVIP standard' },
  { rank: 8, name: 'Jet Aviation', region: 'Europe/USA/UAE', fleet: '300+', why: 'Charter + management + MRO across 3 regions' },
  { rank: 9, name: 'Gama Aviation', region: 'UK/USA/UAE', fleet: '~90', why: 'Multi-region partner — charter + special mission + air ambulance' },
  { rank: 10, name: 'Pawan Hans', region: 'India', fleet: '38', why: 'India\'s largest helicopter operator — pan-India bases' },
  { rank: 11, name: 'Global Vectra Helicorp', region: 'India', fleet: '28', why: 'Largest private heli operator in India — offshore + VIP' },
  { rank: 12, name: 'REVA Inc.', region: 'USA', fleet: '~16', why: 'Americas largest dedicated air-ambulance fleet' },
  { rank: 13, name: 'Abu Dhabi Aviation', region: 'UAE', fleet: '~60', why: 'Largest commercial helicopter fleet in Middle East + 24hr medevac' },
  { rank: 14, name: 'flyExclusive', region: 'USA', fleet: '100+', why: 'Fast-growing US charter — active in wholesale/subcharter' },
  { rank: 15, name: 'JetSetGo (India Flysafe)', region: 'India', fleet: '10+', why: 'India\'s leading aggregator — jets + helis + air ambulance' },
];

const regionColors = { India: '#FFBF00', USA: '#4A90E8', UK: '#4CAF50', UAE: '#E8724A', Europe: '#9B59B6' };

export default function Overview() {
  const stats = useMemo(() => {
    const byRegion = {};
    let totalFleet = 0;
    let charterCount = 0;
    let privateCount = 0;
    const specMap = {};

    operators.forEach(op => {
      byRegion[op.region] = (byRegion[op.region] || 0) + 1;
      const fs = parseInt(op.fleetSize) || 0;
      totalFleet += fs;
      if (op.leadType === 'Charter-for-hire') charterCount++;
      else privateCount++;
      op.specializations.split(/[,;]/).forEach(s => {
        const k = s.trim().toLowerCase();
        if (k.length > 3) specMap[k] = (specMap[k] || 0) + 1;
      });
    });

    const regionData = Object.entries(byRegion).map(([name, value]) => ({ name, value }));
    const topSpecs = Object.entries(specMap).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name: name.length > 20 ? name.slice(0,20)+'...' : name, value }));

    return { byRegion, totalFleet, charterCount, privateCount, regionData, topSpecs, total: operators.length };
  }, []);

  return (
    <div>
      {/* KPI CARDS */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Operators', value: stats.total, icon: '✈️', sub: 'Across 5 regions' },
          { label: 'Charter-for-hire', value: stats.charterCount, icon: '🎯', sub: 'Active leads' },
          { label: 'Private / Corporate', value: stats.privateCount, icon: '🏢', sub: 'Company fleets' },
          { label: 'Countries Covered', value: '20+', icon: '🌍', sub: 'India, USA, UK, UAE, Europe' },
          { label: 'Top Targets', value: 15, icon: '⭐', sub: 'Priority partners' },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 24 }}>{kpi.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: GOLD }}>{kpi.value}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* PIE CHART */}
        <div className="card">
          <div className="section-title">Operators by Region</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.regionData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {stats.regionData.map((entry, i) => (
                  <Cell key={i} fill={regionColors[entry.name] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' operators', n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}
        <div className="card">
          <div className="section-title">Lead Type by Region</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={Object.keys(stats.byRegion).map(region => {
              const ops = operators.filter(o => o.region === region);
              return {
                region,
                Charter: ops.filter(o => o.leadType === 'Charter-for-hire').length,
                Private: ops.filter(o => o.leadType !== 'Charter-for-hire').length,
              };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="region" tick={{ fill: '#B89A6A', fontSize: 11 }} />
              <YAxis tick={{ fill: '#B89A6A', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Charter" fill={GOLD} radius={[4,4,0,0]} />
              <Bar dataKey="Private" fill={CORAL} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP SPECIALIZATIONS */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">Top Specializations</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.topSpecs} layout="vertical">
            <XAxis type="number" tick={{ fill: '#B89A6A', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#B89A6A', fontSize: 11 }} width={160} />
            <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} />
            <Bar dataKey="value" fill={GOLD} radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP 15 TARGETS */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <span className="section-title" style={{ margin: 0 }}>Top 15 Priority Targets</span>
          <span className="badge badge-gold">Curated Picks</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Operator</th>
                <th>Region</th>
                <th>Fleet</th>
                <th>Why a Strong Target</th>
              </tr>
            </thead>
            <tbody>
              {topTargetsList.map(t => (
                <tr key={t.rank}>
                  <td><span style={{ background: GOLD, color: '#1C1208', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{t.rank}</span></td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td><span className="badge badge-blue">{t.region}</span></td>
                  <td style={{ color: GOLD, fontWeight: 600 }}>{t.fleet}</td>
                  <td style={{ fontSize: 12, opacity: 0.85 }}>{t.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
