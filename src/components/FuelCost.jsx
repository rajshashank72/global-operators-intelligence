import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AIRCRAFT_RATES, CAB_CHARGES_USD, MARGIN } from '../data/rateCard';

const GOLD = '#FFBF00';
const CORAL = '#E8724A';

function CountUp({ target, prefix = '', suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(start + diff * eased));
      if (t < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function FuelCost() {
  const [selected, setSelected] = useState(AIRCRAFT_RATES[3]);
  const [hours, setHours] = useState(3);
  const [jetA1Price, setJetA1Price] = useState(0.95); // USD per litre

  const fuelBurn = selected.fuelBurnLph * hours;
  const fuelCost = fuelBurn * jetA1Price;
  const pilotCost = selected.pilots === 1
    ? selected.pilotCaptainRate * hours
    : (selected.pilotCaptainRate + selected.pilotFORate) * hours;
  const aircraftCost = selected.aircraftRateUSD * hours;
  const total = (pilotCost + aircraftCost + 500 + CAB_CHARGES_USD) * MARGIN;

  const comparisonData = AIRCRAFT_RATES.map(r => ({
    name: r.type.replace(' Jet', '').replace(' (', '\n('),
    'Aircraft Rate': r.aircraftRateUSD,
    'Fuel Cost/hr': Math.round(r.fuelBurnLph * jetA1Price),
  }));

  const radarData = [
    { metric: 'Speed', value: Math.round((selected.cruiseSpeed / 980) * 100) },
    { metric: 'Fuel Eff.', value: Math.round((1 - selected.fuelBurnLph / 1100) * 100) },
    { metric: 'Range', value: Math.round((selected.cruiseSpeed / 980) * 90) },
    { metric: 'Capacity', value: AIRCRAFT_RATES.indexOf(selected) * 12 + 20 },
    { metric: 'Cost Eff.', value: Math.round((1 - selected.aircraftRateUSD / 16800) * 100) },
  ];

  return (
    <div>
      {/* JET A-1 TICKER */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, borderColor: GOLD }}>
        <span style={{ fontSize: 18 }}>⛽</span>
        <div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>JET A-1 FUEL PRICE (Live Reference)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>${jetA1Price.toFixed(2)} / litre</div>
        </div>
        <input type="range" min="0.60" max="1.80" step="0.01" value={jetA1Price} onChange={e => setJetA1Price(parseFloat(e.target.value))} style={{ flex: 1, accentColor: GOLD }} />
        <span style={{ fontSize: 12, opacity: 0.6 }}>Adjust manually</span>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* AIRCRAFT SELECTOR */}
        <div className="card">
          <div className="section-title">Select Aircraft</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AIRCRAFT_RATES.map(r => (
              <div key={r.type} onClick={() => setSelected(r)} style={{
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: selected.type === r.type ? `2px solid ${GOLD}` : '1px solid rgba(201,165,53,0.2)',
                background: selected.type === r.type ? 'rgba(201,165,53,0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.type}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{r.examples}</div>
                  </div>
                  <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>${r.aircraftRateUSD.toLocaleString()}/hr</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* HOURS SLIDER */}
          <div className="card">
            <div className="section-title">Flight Hours: {hours}h</div>
            <input type="range" min="1" max="20" value={hours} onChange={e => setHours(parseInt(e.target.value))} style={{ width: '100%', accentColor: GOLD, margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.5 }}>
              <span>1 hr</span><span>20 hrs</span>
            </div>
          </div>

          {/* ANIMATED KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Fuel Burn', value: fuelBurn, suffix: ' L', icon: '⛽' },
              { label: 'Fuel Cost', value: Math.round(fuelCost), prefix: '$', icon: '💵' },
              { label: 'Pilot Cost', value: Math.round(pilotCost), prefix: '$', icon: '👨‍✈️' },
              { label: 'Total Quote', value: Math.round(total), prefix: '$', icon: '💰' },
            ].map((k, i) => (
              <div key={i} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>
                  <CountUp target={Math.round(k.value)} prefix={k.prefix || ''} suffix={k.suffix || ''} />
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* AIRCRAFT RADAR */}
          <div className="card">
            <div className="section-title">Aircraft Profile</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(201,165,53,0.2)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#B89A6A', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* COMPARISON CHART */}
      <div className="card">
        <div className="section-title">Aircraft Rate Comparison</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={comparisonData}>
            <XAxis dataKey="name" tick={{ fill: '#B89A6A', fontSize: 10 }} />
            <YAxis tick={{ fill: '#B89A6A', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#2A1C0C', border: '1px solid #3D2A10', borderRadius: 8 }} formatter={v => '$' + v.toLocaleString() + '/hr'} />
            <Bar dataKey="Aircraft Rate" fill={GOLD} radius={[4,4,0,0]} />
            <Bar dataKey="Fuel Cost/hr" fill={CORAL} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
