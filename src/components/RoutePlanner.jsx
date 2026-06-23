import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { operators } from '../data/operators';
import { CITY_COORDS } from '../data/cityCoords';
import { AIRCRAFT_RATES as DEFAULT_RATES, CAB_CHARGES_USD, MARGIN, AIRPORT_CHARGES, GST_INDIA, GST_INTERNATIONAL } from '../data/rateCard';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import fleetData from '../data/fleetData';

const GOLD = '#FFBF00';
const INDIA_COUNTRIES = ['india'];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const planeIcon = L.divIcon({
  html: `<div style="background:#FFBF00;border:2px solid #fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:hidden;">
    <img src="/jet.png" style="width:28px;height:28px;object-fit:contain;" />
  </div>`,
  className: '', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -19]
});

const animatedPlaneIcon = (angle) => {
  const isLeftward = angle > 90 && angle < 270;
  return L.divIcon({
    html: `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3));transform:rotate(${angle + 90}deg) ${isLeftward ? 'scaleY(-1)' : ''};transform-origin:center;">
      <img src="/jet.png" style="width:48px;height:48px;object-fit:contain;" />
    </div>`,
    className: '', iconSize: [48, 48], iconAnchor: [24, 24]
  });
};

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
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

function getBearing(from, to) {
  const lat1 = from[0] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const dLon = (to[1] - from[1]) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// ── Helper: load image as base64 for jsPDF ──────────────────
async function imageToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
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
  const [AIRCRAFT_RATES, setAircraftRates] = useState(DEFAULT_RATES);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'rateCard'), (snap) => {
      if (snap.exists() && snap.data().rates) setAircraftRates(snap.data().rates);
    });
    return unsub;
  }, []);

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [aircraft, setAircraft] = useState(AIRCRAFT_RATES[3]);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [nearestOps, setNearestOps] = useState([]);
  const [distance, setDistance] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [highlightedOpId, setHighlightedOpId] = useState(null);
  const [includeCab, setIncludeCab] = useState(false);
  const [selectedFleetAircraft, setSelectedFleetAircraft] = useState(null);
  const markerRefs = useRef({});

  const getCityCoords = (name) => {
    const key = name.trim().toLowerCase();
    return CITY_COORDS[key] || null;
  };

  // ── Real-time distance: fires whenever fromCity or toCity changes ──
  useEffect(() => {
    const fc = getCityCoords(fromCity);
    const tc = getCityCoords(toCity);
    if (fc && tc) {
      const dist = haversine(fc, tc);
      setLiveDistance(dist);
      // Auto-deselect aircraft category if it becomes restricted
      if (aircraft && isAircraftDisabled(aircraft, dist)) {
        const firstValid = AIRCRAFT_RATES.find(r => !isAircraftDisabled(r, dist));
        if (firstValid) setAircraft(firstValid);
      }
    } else {
      setLiveDistance(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCity, toCity]);

  const opWithCoords = useMemo(() => {
    return operators.map(op => {
      const coords = getCityCoords(op.city);
      return { ...op, coords };
    }).filter(op => op.coords);
  }, []);

  const isAircraftDisabled = (r, dist) => {
    if (!dist || dist === 0) return false;
    const estHours = dist / r.cruiseSpeed;
    return dist > r.maxRangeKm || estHours > r.maxFlightHours;
  };

  const getDisabledReason = (r, dist) => {
    if (!dist || dist === 0) return null;
    const estHours = dist / r.cruiseSpeed;
    if (dist > r.maxRangeKm) return `Range exceeded (max ${r.maxRangeKm.toLocaleString()} km)`;
    if (estHours > r.maxFlightHours) return `Time exceeded (max ${r.maxFlightHours} hrs)`;
    return null;
  };

  // ── rateCard type → fleetData category mapping ────────
  const RATE_TO_FLEET_MAP = {
    'Turboprop':          ['Turboprop'],
    'Very Light Jet':     ['Very Light Jet'],
    'Light Jet':          ['Light Jet'],
    'Midsize Jet':        ['Midsize Jet'],
    'Super Midsize Jet':  ['Super Midsize Jet'],
    'Heavy Jet':          ['Large Cabin Jet', 'Long Range Jet'],
    'Ultra Long Range':   ['Ultra Long Range Jet'],
    'Helicopter (Light)': ['Helicopter'],
    'Helicopter (Medium)':['Helicopter'],
    'Helicopter (Heavy)': ['Helicopter'],
    'VIP Airliner':       ['VIP Airliner'],
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const matchingFleetAircraft = useMemo(() => {
    if (!aircraft) return [];
    const allowedCategories = RATE_TO_FLEET_MAP[aircraft.type] || [aircraft.type];
    return fleetData.filter(f => allowedCategories.includes(f.category));
  }, [aircraft]);

  // Reset selected fleet aircraft when category changes
  useEffect(() => {
    setSelectedFleetAircraft(matchingFleetAircraft.length > 0 ? matchingFleetAircraft[0] : null);
  }, [matchingFleetAircraft]);

  // ── PDF GENERATOR (async for images) ───────────────────
  const generatePDF = async () => {
    if (!quote || !distance) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ── Cream header background ──
    const headerH = 30;
    pdf.setFillColor(255, 253, 247);
    pdf.rect(0, 0, pageW, headerH, 'F');

    // ── Gold bottom border line ──
    pdf.setDrawColor(255, 191, 0);
    pdf.setLineWidth(1.0);
    pdf.line(0, headerH, pageW, headerH);

    // ── Logo — small and tight ──
    const logoSize = 18;
    const logoX = margin;
    const logoY = (headerH - logoSize) / 2;
    try {
      const logoB64 = await imageToBase64('/logo.png');
      if (logoB64) {
        pdf.addImage(logoB64, 'PNG', logoX, logoY, logoSize, logoSize);
      }
    } catch (e) { /* logo optional */ }

    // ── ASR AVIATION + subtitle tightly packed ──
    const textX = margin + logoSize + 4;
    const midY = headerH / 2;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(26, 26, 46);
    pdf.text('ASR AVIATION', textX, midY - 1);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 191, 0);
    pdf.text('GLOBAL OPERATOR INTELLIGENCE', textX, midY + 6);

    // ── Right side tightly packed ──
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(26, 26, 46);
    pdf.text('CHARTER QUOTATION', pageW - margin, midY - 1, { align: 'right' });

    pdf.setFont('times', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Date: ${today}`, pageW - margin, midY + 6, { align: 'right' });

    y = headerH + 10;

    // ── Route box ──
    pdf.setFillColor(253, 250, 245);
    pdf.roundedRect(margin, y, contentW, 22, 3, 3, 'F');
    pdf.setDrawColor(240, 235, 224);
    pdf.roundedRect(margin, y, contentW, 22, 3, 3, 'S');

    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(26, 26, 46);
    pdf.text(fromCity, margin + 6, y + 9);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(136, 136, 136);
    pdf.text('DEPARTURE', margin + 6, y + 16);

    // Centre: blank (no arrow)

    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(26, 26, 46);
    pdf.text(toCity, pageW - margin - 6, y + 9, { align: 'right' });
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(136, 136, 136);
    pdf.text('DESTINATION', pageW - margin - 6, y + 16, { align: 'right' });

    y += 30;

    // ── Flight details ──
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(184, 134, 11);
    pdf.text('FLIGHT DETAILS', margin, y);
    pdf.setDrawColor(255, 191, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 2, margin + 36, y + 2);
    y += 8;

    const aircraftLabel = selectedFleetAircraft
      ? `${selectedFleetAircraft.name} — ${selectedFleetAircraft.category}`
      : aircraft.type;

    const flightDetails = [
      ['Aircraft', aircraftLabel],
      ['Distance', `${Math.round(distance).toLocaleString()} km`],
      ['Estimated Flight Time', `${quote.flightHours} hours`],
    ];

    flightDetails.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        pdf.setFillColor(253, 250, 245);
        pdf.rect(margin, y - 4, contentW, 8, 'F');
      }
      pdf.setFont('times', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(136, 136, 136);
      pdf.text(label, margin + 4, y);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(26, 26, 46);
      pdf.text(value, pageW - margin - 4, y, { align: 'right' });
      y += 8;
    });

    y += 4;

    // ── Aircraft images + description (if fleet aircraft selected) ──
    if (selectedFleetAircraft) {
      try {
        const extB64 = await imageToBase64(selectedFleetAircraft.extImage);
        const intB64 = await imageToBase64(selectedFleetAircraft.intImage);

        const imgW = (contentW - 6) / 2;
        const imgH = 38;

        if (extB64) {
          pdf.addImage(extB64, 'JPEG', margin, y, imgW, imgH, undefined, 'FAST');
          pdf.setFont('times', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(136, 136, 136);
          pdf.text('EXTERIOR', margin + imgW / 2, y + imgH + 4, { align: 'center' });
        }
        if (intB64) {
          pdf.addImage(intB64, 'JPEG', margin + imgW + 6, y, imgW, imgH, undefined, 'FAST');
          pdf.setFont('times', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(136, 136, 136);
          pdf.text('INTERIOR', margin + imgW + 6 + imgW / 2, y + imgH + 4, { align: 'center' });
        }

        y += imgH + 10;
      } catch (e) { /* images optional */ }

      // ── Aircraft description ──
      pdf.setFont('times', 'italic');
      pdf.setFontSize(8.5);
      pdf.setTextColor(85, 85, 85);
      const descLines = pdf.splitTextToSize(`"${selectedFleetAircraft.description}"`, contentW - 8);
      pdf.text(descLines, margin + 4, y);
      y += descLines.length * 5 + 4;

      // Capacity
      pdf.setFont('times', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(136, 136, 136);
      pdf.text(`Passenger Capacity: Up to ${selectedFleetAircraft.capacity} passengers`, margin + 4, y);
      y += 10;
    }

    y += 2;

    // ── Price breakdown ──
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(184, 134, 11);
    pdf.text('PRICE BREAKDOWN', margin, y);
    pdf.setDrawColor(255, 191, 0);
    pdf.line(margin, y + 2, margin + 40, y + 2);
    y += 8;

    const pricingRows = [
      ['Charter Service Fee', `$${parseInt(quote.aircraftCost).toLocaleString()}`],
      ['Airport Handling & Landing Charges', `$${parseInt(quote.airportCharges).toLocaleString()}`],
      ...(parseInt(quote.cabCharges) > 0 ? [['Ground Transportation (Cab)', `$${parseInt(quote.cabCharges).toLocaleString()}`]] : []),
      [`Government Tax / GST (${quote.gstRate}%)`, `$${parseInt(quote.gstAmount).toLocaleString()}`],
    ];

    pricingRows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        pdf.setFillColor(253, 250, 245);
        pdf.rect(margin, y - 4, contentW, 8, 'F');
      }
      pdf.setFont('times', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(85, 85, 85);
      pdf.text(label, margin + 4, y);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(26, 26, 46);
      pdf.text(value, pageW - margin - 4, y, { align: 'right' });
      pdf.setDrawColor(240, 235, 224);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y + 2, pageW - margin, y + 2);
      y += 9;
    });

    y += 4;

    // ── Total box ──
    pdf.setFillColor(255, 191, 0);
    pdf.roundedRect(margin, y, contentW, 14, 3, 3, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(26, 26, 46);
    pdf.text('TOTAL CHARTER QUOTE', margin + 6, y + 9);
    pdf.setFontSize(14);
    pdf.text(`$${parseInt(quote.total).toLocaleString()}`, pageW - margin - 6, y + 9, { align: 'right' });

    y += 22;

    // ── Notes ──
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(136, 136, 136);
    pdf.text(`* ${quote.isIndia ? 'GST @ 18% applicable for India routes' : 'GST @ 5% applicable for international routes'}`, margin, y);
    pdf.text('* All amounts in USD', margin, y + 5);

    y += 16;

    // ── Terms (only if space remains) ──
    if (y < 240) {
      pdf.setFillColor(248, 245, 239);
      pdf.roundedRect(margin, y, contentW, 38, 3, 3, 'F');
      pdf.setFont('times', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(26, 26, 46);
      pdf.text('TERMS & CONDITIONS', margin + 4, y + 7);
      const terms = [
        '• This quotation is valid for 48 hours from the date of issue.',
        '• Final pricing subject to confirmation of aircraft availability.',
        '• Cancellation charges may apply as per operator policy.',
        '• Prices are subject to change based on fuel surcharges.',
        '• Airport charges may vary based on handling agent.',
      ];
      pdf.setFont('times', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(85, 85, 85);
      terms.forEach((term, i) => pdf.text(term, margin + 4, y + 14 + i * 5));
    }

    // ── Footer ──
    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 280, pageW, 17, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 191, 0);
    pdf.text('ASR Aviation — Global Operator Intelligence', pageW / 2, 287, { align: 'center' });
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    pdf.text('Confidential — For client use only', pageW / 2, 292, { align: 'center' });

    pdf.save(`ASR_Quote_${fromCity}_to_${toCity}_${today.replace(/ /g, '_')}.pdf`);
  };
  // ── END PDF ──────────────────────────────────────────────

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

    let currentAircraft = aircraft;
    if (isAircraftDisabled(aircraft, dist)) {
      const firstValid = AIRCRAFT_RATES.find(r => !isAircraftDisabled(r, dist));
      if (firstValid) { currentAircraft = firstValid; setAircraft(firstValid); }
    }

    const sorted = opWithCoords
      .map(op => ({ ...op, distFromDep: haversine(fc, op.coords) }))
      .sort((a, b) => a.distFromDep - b.distFromDep)
      .slice(0, 5);
    setNearestOps(sorted);

    const flightHours = dist / currentAircraft.cruiseSpeed;
    const aircraftCost = currentAircraft.aircraftRateUSD * flightHours;
    const airportCharges = getTierCharge(fromCity) + getTierCharge(toCity);
    const cabAmount = includeCab ? CAB_CHARGES_USD : 0;
    const subtotalBeforeMargin = aircraftCost + airportCharges + cabAmount;
    const marginAmount = subtotalBeforeMargin * (MARGIN - 1);
    const subtotal = subtotalBeforeMargin + marginAmount;

    const nearestOp = sorted[0];
    const isIndia = isIndiaOperator(nearestOp);
    const gstRate = isIndia ? GST_INDIA : GST_INTERNATIONAL;
    const gstAmount = subtotal * gstRate;
    const total = subtotal + gstAmount;

    setQuote({
      flightHours: flightHours.toFixed(2),
      aircraftCost: aircraftCost.toFixed(0),
      airportCharges: airportCharges.toFixed(0),
      cabCharges: cabAmount.toFixed(0),
      marginAmount: marginAmount.toFixed(0),
      gstRate: (gstRate * 100).toFixed(0),
      gstAmount: gstAmount.toFixed(0),
      subtotal: subtotal.toFixed(0),
      total: total.toFixed(0),
      fuelBurn: (currentAircraft.fuelBurnLph * flightHours).toFixed(0),
      isIndia,
    });
  };

  const handleOpClick = (op) => {
    if (op.coords) {
      setFlyToCoords(op.coords);
      setHighlightedOpId(op.id);
      setTimeout(() => {
        if (markerRefs.current[op.id]) markerRefs.current[op.id].openPopup();
      }, 1300);
    }
  };

  const routePositions = fromCoords && toCoords ? [fromCoords, toCoords] : [];
  const currentDisabledReason = getDisabledReason(aircraft, liveDistance || distance);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, minHeight: '80vh' }}>
      {/* LEFT PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="section-title">Plan Your Route</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CityInput label="FROM CITY" value={fromCity} onChange={setFromCity} placeholder="e.g. Mumbai, London, Dubai" />
            <CityInput label="TO CITY" value={toCity} onChange={setToCity} placeholder="e.g. New York, Paris, Dubai" />

            {/* ── LIVE ROUTE INFO STRIP ── */}
            {liveDistance && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,191,0,0.08)',
                border: '1px solid rgba(255,191,0,0.3)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>✈</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', fontFamily: "'Libre Baskerville', serif" }}>
                    {Math.round(liveDistance).toLocaleString()} km
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  ~{(liveDistance / (aircraft?.cruiseSpeed || 800)).toFixed(1)} hrs
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: currentDisabledReason ? '#E84A4A' : '#15803D',
                  background: currentDisabledReason ? 'rgba(232,74,74,0.08)' : 'rgba(21,128,61,0.08)',
                  padding: '2px 8px', borderRadius: 20,
                  border: currentDisabledReason ? '1px solid rgba(232,74,74,0.3)' : '1px solid rgba(21,128,61,0.3)',
                }}>
                  {currentDisabledReason ? 'Out of range' : aircraft?.type + ' recommended'}
                </div>
              </div>
            )}

            {/* ── AIRCRAFT CATEGORY DROPDOWN ── */}
            <div>
              <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, letterSpacing: 0.5 }}>AIRCRAFT TYPE</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={aircraft.type}
                  onChange={e => {
                    const selected = AIRCRAFT_RATES.find(r => r.type === e.target.value);
                    if (selected && !isAircraftDisabled(selected, liveDistance || distance)) setAircraft(selected);
                  }}
                  style={{
                    width: '100%', padding: '10px 36px 10px 14px',
                    borderRadius: 8,
                    border: currentDisabledReason ? '1px solid #E84A4A' : '1px solid #EDE8DE',
                    background: '#FFFFFF', fontSize: 13, fontWeight: 600,
                    color: '#1a1a2e', cursor: 'pointer', outline: 'none',
                    appearance: 'none', fontFamily: "'Libre Baskerville', serif",
                  }}
                >
                  {AIRCRAFT_RATES.map(r => {
                    const disabled = isAircraftDisabled(r, liveDistance || distance);
                    const reason = getDisabledReason(r, liveDistance || distance);
                    return (
                      <option key={r.type} value={r.type} disabled={disabled}
                        style={{ color: disabled ? '#AAAAAA' : '#1a1a2e' }}>
                        {disabled ? `X ${r.type} — ${reason}` : `> ${r.type}`}
                      </option>
                    );
                  })}
                </select>
                <div style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none', color: GOLD, fontSize: 11,
                }}>▼</div>
              </div>

              {currentDisabledReason ? (
                <div style={{ fontSize: 11, color: '#E84A4A', marginTop: 5 }}>
                  ⚠️ {currentDisabledReason}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 5 }}>
                  {aircraft.examples} · max {aircraft.maxRangeKm.toLocaleString()} km · {aircraft.maxFlightHours} hrs
                </div>
              )}
            </div>

            {/* ── SPECIFIC AIRCRAFT DROPDOWN (from fleetData) ── */}
            {matchingFleetAircraft.length > 0 && (
              <div>
                <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, letterSpacing: 0.5 }}>
                  SELECT SPECIFIC AIRCRAFT
                </div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedFleetAircraft?.name || ''}
                    onChange={e => {
                      const found = matchingFleetAircraft.find(f => f.name === e.target.value);
                      setSelectedFleetAircraft(found || null);
                    }}
                    style={{
                      width: '100%', padding: '10px 36px 10px 14px',
                      borderRadius: 8, border: '1px solid #EDE8DE',
                      background: '#FFFFFF', fontSize: 13, fontWeight: 600,
                      color: '#1a1a2e', cursor: 'pointer', outline: 'none',
                      appearance: 'none', fontFamily: "'Libre Baskerville', serif",
                    }}
                  >
                    {matchingFleetAircraft.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none', color: GOLD, fontSize: 11,
                  }}>▼</div>
                </div>

                {/* Selected aircraft mini preview — name + capacity only */}
                {selectedFleetAircraft && (
                  <div style={{
                    marginTop: 6, padding: '7px 12px',
                    background: '#FDFAF5', borderRadius: 8,
                    border: '1px solid #EDE8DE',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', fontFamily: "'Libre Baskerville', serif" }}>
                      {selectedFleetAircraft.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#888' }}>
                      Up to {selectedFleetAircraft.capacity} pax
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CAB CHARGES TOGGLE */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: '#F8F5EF', border: '1px solid #EDE8DE',
            }}>
              <input
                type="checkbox"
                id="cabToggle"
                checked={includeCab}
                onChange={e => setIncludeCab(e.target.checked)}
                style={{ accentColor: GOLD, width: 14, height: 14, cursor: 'pointer' }}
              />
              <label htmlFor="cabToggle" style={{
                fontSize: 12, color: '#555', cursor: 'pointer',
                userSelect: 'none', fontFamily: "'Libre Baskerville', serif",
              }}>
                Include cab charges (+${CAB_CHARGES_USD})
              </label>
            </div>

            {error && <div style={{ color: '#E84A4A', fontSize: 12 }}>⚠️ {error}</div>}

            <button className="btn-gold" onClick={calculate} style={{ width: '100%', padding: 12, fontSize: 14 }}>
              Calculate Route & Quote
            </button>
          </div>
        </div>

        {/* QUOTE CARD */}
        {quote && distance && (
          <div className="card" style={{ borderColor: GOLD }}>
            <div className="section-title">💰 Price Quotation</div>

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

            {[
              ['Aircraft Cost', '$' + parseInt(quote.aircraftCost).toLocaleString()],
              ['Airport Charges', '$' + parseInt(quote.airportCharges).toLocaleString()],
              ...(parseInt(quote.cabCharges) > 0 ? [['Cab Charges', '$' + parseInt(quote.cabCharges).toLocaleString()]] : []),
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

            <button
              onClick={generatePDF}
              style={{
                width: '100%', marginTop: 14, padding: '11px', borderRadius: 8,
                background: '#1a1a2e', border: 'none',
                color: '#FFBF00', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: "'Libre Baskerville', serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#2d1f5e'}
              onMouseOut={e => e.currentTarget.style.background = '#1a1a2e'}
            >
              Download Client Quotation (PDF)
            </button>
          </div>
        )}

        {/* NEAREST OPERATORS */}
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
                  transition: 'all 0.2s', marginBottom: 4
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
            <Marker key={op.id} position={op.coords} icon={planeIcon}
              ref={el => { if (el) markerRefs.current[op.id] = el; }}>
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