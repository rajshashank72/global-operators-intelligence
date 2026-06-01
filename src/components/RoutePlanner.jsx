import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { operators } from '../data/operators';
import { CITY_COORDS } from '../data/cityCoords';
import { AIRCRAFT_RATES, CAB_CHARGES_USD, MARGIN, AIRPORT_CHARGES, GST_INDIA, GST_INTERNATIONAL } from '../data/rateCard';

const GOLD = '#FFBF00';

const INDIA_COUNTRIES = ['india'];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const planeIcon = L.divIcon({
  html: `<div style="background:#FFBF00;border:2px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">✈️</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17]
});

const animatedPlaneIcon = (angle) => L.divIcon({
  html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));transform:rotate(${angle}deg)">✈️</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18]
});

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTierCharge(city) {
  const tier1 = ['mumbai', 'delhi', 'dubai', 'london', 'new york', 'los angeles', 'chicago', 'paris', 'frankfurt', 'abu dhabi', 'bangalore', 'hyderabad', 'chennai'];
  const c = city.toLowerCase();
  if (tier1.some(t => c.includes(t))) return AIRPORT_CHARGES.tier1;
  return AIRPORT_CHARGES.tier2;
}

function isIndiaOperator(operator) {
  return INDIA_COUNTRIES.includes(operator?.country?.toLowerCase());
}

function interpolate(from, to, t) {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
}

function getBearing(from, to) {
  const lat1 = from[0] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const dLon = (to[1] - from[1]) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function MapController({ routePositions, flyToCoords }) {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) map.flyTo(flyToCoords, 10, { duration: 1.2 });
  }, [flyToCoords, map]);
  useEffect(() => {
    if (routePositions.length === 2) {
      map.fitBounds(routePositions, { padding: [60, 60], animate: true, duration: 1 });
    }
  }, [routePositions, map]);
  return null;
}

function AnimatedPlane({ fromCoords, toCoords }) {
  const [pos, setPos] = useState(fromCoords);
  const [angle, setAngle] = useState(0);
  const progressRef = useRef(0);
  const animRef = useRef(null);
  const DURATION = 3000;

  useEffect(() => {
    if (!fromCoords || !toCoords) return;
    progressRef.current = 0;
    const bearing = getBearing(fromCoords, toCoords);
    setAngle(bearing);
    let startTime = null;
    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = (elapsed % DURATION) / DURATION;
      progressRef.current = t;
      const newPos = interpolate(fromCoords, toCoords, t);
      setPos(newPos);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [fromCoords, toCoords]);

  if (!pos) return null;
  return <Marker position={pos} icon={animatedPlaneIcon(angle)} />;
}

function searchCities(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();
  const allCities = Object.keys(CITY_COORDS).map(c => c.replace(/^\w/, s => s.toUpperCase()));
  return allCities.filter(city => {
    const words = city.toLowerCase().split(' ');
    return words.some(word => word.startsWith(q)) || city.toLowerCase().startsWith(q);
  }).slice(0, 30);
}

function CityInput({ label, value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (value.length >= 1) {
      const results = searchCities(value);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
    setHighlighted(-1);
  }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    if (e.key === 'ArrowUp') setHighlighted(h => Math.max(h - 1, 0));
    if (e.key === 'Enter' && highlighted >= 0) { onChange(suggestions[highlighted]); setShowDropdown(false); }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, letterSpacing: 0.5 }}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => value.length >= 1 && suggestions.length > 0 && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ width: '100%' }}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#FFFFFF', border: '1px solid #D4C4A0',
          borderRadius: '0 0 8px 8px', zIndex: 999,
          maxHeight: '210px', overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }}>
          {suggestions.map((city, i) => (
            <div key={city} onMouseDown={() => { onChange(city); setShowDropdown(false); }}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: '#1C1208',
                background: highlighted === i ? '#F5ECD7' : '#FFFFFF',
                borderBottom: i < suggestions.length - 1 ? '1px solid #F0EAD6' : 'none',
                fontWeight: highlighted === i ? 600 : 400
              }}
              onMouseEnter={() => setHighlighted(i)}
            >{city}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutePlanner() {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [aircraft, setAircraft] = useState(AIRCRAFT_RATES[3]);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [nearestOps, setNearestOps] = useState([]);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [highlightedOpId, setHighlightedOpId] = useState(null);
  const markerRefs = useRef({});

  const getCityCoords = (name) => {
    const key = name.trim().toLowerCase();
    return CITY_COORDS[key] || null;
  };

  const opWithCoords = useMemo(() => {
    return operators.map(op => {
      const coords = getCityCoords(op.city);
      return { ...op, coords };
    }).filter(op => op.coords);
  }, []);

  const calculate = () => {
    setError('');
    setFlyToCoords(null);
    setHighlightedOpId(null);
    const fc = getCityCoords(fromCity);
    const tc = getCityCoords(toCity);
    if (!fc) { setError(`City "${fromCity}" not found.`); return; }
    if (!tc) { setError(`City "${toCity}" not found.`); return; }
    setFromCoords(fc);
    setToCoords(tc);
    const dist = haversine(fc, tc);
    setDistance(dist);

    const sorted = opWithCoords
      .map(op => ({ ...op, distFromDep: haversine(fc, op.coords) }))
      .sort((a, b) => a.distFromDep - b.distFromDep)
      .slice(0, 5);
    setNearestOps(sorted);

    const flightHours = dist / aircraft.cruiseSpeed;

    // Aircraft rate is ALL-IN (includes crew) — crew fee is % on top for admin overhead
    const aircraftCost = aircraft.aircraftRateUSD * flightHours;
    const crewFee = aircraftCost * (aircraft.crewFeePercent || 0.09);
    const airportCharges = getTierCharge(fromCity) + getTierCharge(toCity);
    const subtotalBeforeMargin = aircraftCost + crewFee + airportCharges + CAB_CHARGES_USD;
    const marginAmount = subtotalBeforeMargin * (MARGIN - 1);
    const subtotal = subtotalBeforeMargin + marginAmount;

    // GST based on nearest operator's country
    const nearestOp = sorted[0];
    const isIndia = isIndiaOperator(nearestOp);
    const gstRate = isIndia ? GST_INDIA : GST_INTERNATIONAL;
    const gstAmount = subtotal * gstRate;
    const total = subtotal + gstAmount;

    setQuote({
      flightHours: flightHours.toFixed(2),
      aircraftCost: aircraftCost.toFixed(0),
      crewFee: crewFee.toFixed(0),
      airportCharges: airportCharges.toFixed(0),
      cabCharges: CAB_CHARGES_USD.toFixed(0),
      marginAmount: marginAmount.toFixed(0),
      gstRate: (gstRate * 100).toFixed(0),
      gstAmount: gstAmount.toFixed(0),
      subtotal: subtotal.toFixed(0),
      total: total.toFixed(0),
      fuelBurn: (aircraft.fuelBurnLph * flightHours).toFixed(0),
      isIndia,
    });
  };

  const handleOpClick = (op) => {
    if (op.coords) {
      setFlyToCoords(op.coords);
      setHighlightedOpId(op.id);
      setTimeout(() => {
        if (markerRefs.current[op.id]) {
          markerRefs.current[op.id].openPopup();
        }
      }, 1300);
    }
  };

  const routePositions = fromCoords && toCoords ? [fromCoords, toCoords] : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, minHeight: '80vh' }}>
      {/* LEFT PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="section-title">Plan Your Route</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CityInput label="FROM CITY" value={fromCity} onChange={setFromCity} placeholder="e.g. Mumbai, London, Dubai" />
            <CityInput label="TO CITY" value={toCity} onChange={setToCity} placeholder="e.g. New York, Paris, Dubai" />
            <div>
              <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, letterSpacing: 0.5 }}>AIRCRAFT TYPE</div>
              <select value={aircraft.type} onChange={e => setAircraft(AIRCRAFT_RATES.find(r => r.type === e.target.value))} style={{ width: '100%' }}>
                {AIRCRAFT_RATES.map(r => <option key={r.type} value={r.type}>{r.type}</option>)}
              </select>
              <div style={{ fontSize: 11, opacity: 0.5, fontStyle: 'italic', marginTop: 4 }}>{aircraft.examples}</div>
            </div>
            {error && <div style={{ color: '#E84A4A', fontSize: 12 }}>⚠️ {error}</div>}
            <button className="btn-gold" onClick={calculate} style={{ width: '100%', padding: 12, fontSize: 14 }}>
              🗺️ Calculate Route & Quote
            </button>
          </div>
        </div>

        {quote && distance && (
          <div className="card" style={{ borderColor: GOLD }}>
            <div className="section-title">💰 Price Quotation</div>

            {/* Flight info */}
            {[
              ['Distance', Math.round(distance).toLocaleString() + ' km'],
              ['Flight Time', quote.flightHours + ' hrs'],
              ['Fuel Burn (est.)', parseInt(quote.fuelBurn).toLocaleString() + ' L'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ opacity: 0.7 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            <hr style={{ borderColor: 'rgba(201,165,53,0.2)', margin: '10px 0' }} />

            {/* Cost breakdown */}
            {[
              ['Aircraft Cost', '$' + parseInt(quote.aircraftCost).toLocaleString()],
              ['Crew Fee', '$' + parseInt(quote.crewFee).toLocaleString()],
              ['Airport Charges', '$' + parseInt(quote.airportCharges).toLocaleString()],
              ['Cab Charges', '$' + parseInt(quote.cabCharges).toLocaleString()],
              ['Company Margin (7%)', '$' + parseInt(quote.marginAmount).toLocaleString()],
              [`GST (${quote.gstRate}%)`, '$' + parseInt(quote.gstAmount).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, opacity: 0.7 }}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}

            <hr style={{ borderColor: 'rgba(201,165,53,0.2)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
              <span style={{ color: GOLD }}>Total Quote</span>
              <span style={{ color: GOLD }}>${parseInt(quote.total).toLocaleString()}</span>
            </div>

            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6, textAlign: 'right' }}>
              GST: {quote.isIndia ? 'India operator (18%)' : 'International operator (5%)'}
            </div>
          </div>
        )}

        {nearestOps.length > 0 && (
          <div className="card">
            <div className="section-title">📍 Nearest Operators</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 8 }}>Click to locate on map</div>
            {nearestOps.map((op, i) => (
              <div key={op.id}
                onClick={() => handleOpClick(op)}
                style={{
                  padding: '10px 12px',
                  borderBottom: i < 4 ? '1px solid rgba(201,165,53,0.1)' : 'none',
                  cursor: op.coords ? 'pointer' : 'default',
                  borderRadius: 8,
                  background: highlightedOpId === op.id ? 'rgba(201,165,53,0.12)' : 'transparent',
                  border: highlightedOpId === op.id ? `1px solid ${GOLD}` : '1px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: 4
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{op.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{op.city}, {op.country}</div>
                    <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{op.fleetTypes?.slice(0, 40)}{op.fleetTypes?.length > 40 ? '...' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{Math.round(op.distFromDep)} km</div>
                    {op.coords && <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>📍 locate</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAP */}
      <div style={{ borderRadius: 12, overflow: 'hidden', minHeight: 500 }}>
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', minHeight: 500 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          <MapController routePositions={routePositions} flyToCoords={flyToCoords} />

          {fromCoords && (
            <Marker position={fromCoords} icon={planeIcon}>
              <Popup><strong>{fromCity}</strong><br />Departure</Popup>
            </Marker>
          )}
          {toCoords && (
            <Marker position={toCoords} icon={planeIcon}>
              <Popup><strong>{toCity}</strong><br />Destination</Popup>
            </Marker>
          )}
          {routePositions.length === 2 && (
            <Polyline positions={routePositions} color={GOLD} weight={3} dashArray="8,6" />
          )}
          {fromCoords && toCoords && (
            <AnimatedPlane fromCoords={fromCoords} toCoords={toCoords} />
          )}
          {nearestOps.map(op => op.coords && (
            <Marker
              key={op.id}
              position={op.coords}
              icon={planeIcon}
              ref={el => { if (el) markerRefs.current[op.id] = el; }}
            >
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1C1208' }}>{op.name}</div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>📍 {op.city}, {op.country}</div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>✈️ Fleet Size: {op.fleetSize}</div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>🛩️ {op.fleetTypes?.slice(0, 70)}{op.fleetTypes?.length > 70 ? '...' : ''}</div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>🎯 {op.specializations?.slice(0, 70)}{op.specializations?.length > 70 ? '...' : ''}</div>
                  {op.email && op.email !== 'Not Found' && (
                    <a href={`mailto:${op.email}`} style={{ fontSize: 12, color: '#FFBF00', display: 'block', marginBottom: 3 }}>📧 {op.email}</a>
                  )}
                  {op.website && op.website !== 'Not Found' && (
                    <a href={op.website.startsWith('http') ? op.website : 'https://' + op.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#4A90E8', display: 'block' }}>🌐 {op.website}</a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}