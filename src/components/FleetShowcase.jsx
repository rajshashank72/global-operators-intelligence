// src/components/FleetShowcase.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import fleetData from "../data/fleetData";

/* ─── Category badge colours ─────────────────────────────────────────────── */
const categoryColors = {
  "Ultra Long Range Jet": "#7C3AED",
  "Long Range Jet":       "#1D4ED8",
  "Super Midsize Jet":    "#0369A1",
  "Large Cabin Jet":      "#0F766E",
  "Midsize Jet":          "#047857",
  "Light Jet":            "#15803D",
  "Very Light Jet":       "#65A30D",
  "Turboprop":            "#B45309",
  "Helicopter":           "#C2410C",
  "VIP Airliner":         "#BE185D",
};

/* ─── Single flip card ────────────────────────────────────────────────────── */
function AircraftCard({ aircraft }) {
  const [flipped, setFlipped] = useState(false);
  const badgeColor = categoryColors[aircraft.category] || "#FFBF00";

  return (
    <div
      className="fleet-card-wrapper"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className={`fleet-card-inner ${flipped ? "flipped" : ""}`}>

        {/* ── FRONT (exterior) ── */}
        <div className="fleet-card-face fleet-card-front">
          <div className="fleet-img-wrap">
            <img
              src={aircraft.extImage}
              alt={`${aircraft.name} exterior`}
              className="fleet-img"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="fleet-img-placeholder" style={{ display: "none" }}>
              <span>✈</span>
              <p>Image coming soon</p>
            </div>
          </div>

          <div className="fleet-card-body">
            <span
              className="fleet-badge"
              style={{ backgroundColor: badgeColor + "22", color: badgeColor, borderColor: badgeColor + "55" }}
            >
              {aircraft.category}
            </span>
            <h3 className="fleet-name">{aircraft.name}</h3>
            <p className="fleet-capacity">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, verticalAlign: "middle" }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Up to {aircraft.capacity} passengers
            </p>
            <p className="fleet-desc">{aircraft.description}</p>
          </div>

          <div className="fleet-hover-hint">Hover to see interior →</div>
        </div>

        {/* ── BACK (interior) ── */}
        <div className="fleet-card-face fleet-card-back">
          <div className="fleet-img-wrap">
            <img
              src={aircraft.intImage}
              alt={`${aircraft.name} interior`}
              className="fleet-img"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="fleet-img-placeholder" style={{ display: "none" }}>
              <span>🛋</span>
              <p>Interior preview coming soon</p>
            </div>
          </div>

          <div className="fleet-card-body">
            <span
              className="fleet-badge"
              style={{ backgroundColor: badgeColor + "22", color: badgeColor, borderColor: badgeColor + "55" }}
            >
              Interior View
            </span>
            <h3 className="fleet-name">{aircraft.name}</h3>
            <p className="fleet-desc" style={{ fontStyle: "italic", color: "#78716C" }}>
              "{aircraft.description}"
            </p>
          </div>

          <div className="fleet-hover-hint" style={{ color: "#FFBF00" }}>← Exterior</div>
        </div>

      </div>
    </div>
  );
}

/* ─── Main showcase strip ─────────────────────────────────────────────────── */
export default function FleetShowcase() {
  const trackRef  = useRef(null);
  const rafRef    = useRef(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);
  const SPEED     = 0.5;       // auto-scroll px per frame
  const JUMP      = 260;       // px per arrow click (one card width + gap)

  // duplicate fleet for infinite loop illusion
  const doubled = [...fleetData, ...fleetData];

  const animate = useCallback(() => {
    if (!trackRef.current) return;
    if (!pausedRef.current) {
      offsetRef.current += SPEED;
      const halfWidth = trackRef.current.scrollWidth / 2;
      if (offsetRef.current >= halfWidth) offsetRef.current = 0;
      trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Arrow click handlers — smoothly jump offset
  const scrollLeft = () => {
    if (!trackRef.current) return;
    const halfWidth = trackRef.current.scrollWidth / 2;
    offsetRef.current = (offsetRef.current - JUMP + halfWidth) % halfWidth;
    trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
  };

  const scrollRight = () => {
    if (!trackRef.current) return;
    const halfWidth = trackRef.current.scrollWidth / 2;
    offsetRef.current = (offsetRef.current + JUMP) % halfWidth;
    trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
  };

  return (
    <section className="fleet-showcase-section">
      {/* ── Section header ── */}
      <div className="fleet-section-header">
        <div className="fleet-header-line" />
        <div className="fleet-header-text">
          <span className="fleet-eyebrow">OUR FLEET</span>
          <h2 className="fleet-title">Aircraft We Charter</h2>
          <p className="fleet-subtitle">
            Hover any card to explore the cabin. {fleetData.length} aircraft across {[...new Set(fleetData.map(a => a.category))].length} categories.
          </p>
        </div>
        <div className="fleet-header-line" />
      </div>

      {/* ── Scrolling strip ── */}
      <div
        className="fleet-viewport"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {/* ── LEFT ARROW ── */}
        <button className="fleet-arrow fleet-arrow-left" onClick={scrollLeft} aria-label="Scroll left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* left fade */}
        <div className="fleet-fade fleet-fade-left" />

        <div className="fleet-track" ref={trackRef}>
          {doubled.map((aircraft, idx) => (
            <AircraftCard key={`${aircraft.id}-${idx}`} aircraft={aircraft} />
          ))}
        </div>

        {/* right fade */}
        <div className="fleet-fade fleet-fade-right" />

        {/* ── RIGHT ARROW ── */}
        <button className="fleet-arrow fleet-arrow-right" onClick={scrollRight} aria-label="Scroll right">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      </section>
  );
}

/* ─── Styles (injected once) ──────────────────────────────────────────────── */
const styles = `
  /* ── Section wrapper ── */
  .fleet-showcase-section {
    width: 100%;
    background: #FAFAF8;
    padding: 24px 0 20px;
    border-top: 1px solid #F0EDE8;
    border-bottom: 1px solid #F0EDE8;
    overflow: hidden;
  }

  /* ── Header ── */
  .fleet-section-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 40px 14px;
  }
  .fleet-header-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #FFBF00 60%, transparent);
    opacity: 0.5;
  }
  .fleet-header-text {
    text-align: center;
    flex-shrink: 0;
  }
  .fleet-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: #FFBF00;
    display: block;
    margin-bottom: 6px;
  }
  .fleet-title {
    font-family: 'Libre Baskerville', serif;
    font-size: 22px;
    font-weight: 700;
    color: #1C1917;
    margin: 0 0 6px;
  }
  .fleet-subtitle {
    font-size: 13px;
    color: #78716C;
    margin: 0;
  }

  /* ── Viewport + fade edges ── */
  .fleet-viewport {
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  .fleet-fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 120px;
    z-index: 10;
    pointer-events: none;
  }
  .fleet-fade-left  { left: 0;  background: linear-gradient(90deg, #FAFAF8, transparent); }
  .fleet-fade-right { right: 0; background: linear-gradient(270deg, #FAFAF8, transparent); }

  /* ── Arrow buttons ── */
  .fleet-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.15);
    color: #1C1917;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.10);
  }
  .fleet-arrow:hover {
    background: rgba(255, 191, 0, 0.25);
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 18px rgba(255,191,0,0.25);
    color: #1C1917;
  }
  .fleet-arrow:active {
    transform: translateY(-50%) scale(0.96);
  }
  .fleet-arrow-left  { left: 12px; }
  .fleet-arrow-right { right: 12px; }

  /* ── Scrolling track ── */
  .fleet-track {
    display: flex;
    gap: 16px;
    padding: 8px 80px 16px;
    will-change: transform;
    width: max-content;
  }

  /* ── Card wrapper (3D perspective) ── */
  .fleet-card-wrapper {
    width: 240px;
    height: 260px;
    flex-shrink: 0;
    perspective: 1000px;
    cursor: pointer;
  }

  /* ── Inner flip container ── */
  .fleet-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
    border-radius: 12px;
  }
  .fleet-card-inner.flipped {
    transform: rotateY(180deg);
  }

  /* ── Shared face styles ── */
  .fleet-card-face {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    background: #FFFFFF;
    border: 1px solid #E8E4DF;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  .fleet-card-face:hover {
    box-shadow: 0 8px 28px rgba(0,0,0,0.13);
  }
  .fleet-card-back {
    transform: rotateY(180deg);
  }

  /* ── Image area ── */
  .fleet-img-wrap {
    width: 100%;
    height: 110px;
    overflow: hidden;
    background: #F5F2ED;
    flex-shrink: 0;
  }
  .fleet-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .fleet-card-wrapper:hover .fleet-img {
    transform: scale(1.04);
  }
  .fleet-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #A8A29E;
    gap: 6px;
  }
  .fleet-img-placeholder span { font-size: 28px; }
  .fleet-img-placeholder p   { font-size: 11px; margin: 0; }

  /* ── Card body ── */
  .fleet-card-body {
    padding: 12px 14px 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;
  }

  /* ── Badge ── */
  .fleet-badge {
    display: inline-block;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid;
    width: fit-content;
    text-transform: uppercase;
  }

  /* ── Name ── */
  .fleet-name {
    font-family: 'Libre Baskerville', serif;
    font-size: 13.5px;
    font-weight: 700;
    color: #1C1917;
    margin: 0;
    line-height: 1.3;
  }

  /* ── Pax ── */
  .fleet-capacity {
    font-size: 11.5px;
    color: #78716C;
    margin: 0;
    display: flex;
    align-items: center;
  }

  /* ── Description ── */
  .fleet-desc {
    font-size: 11px;
    color: #57534E;
    margin: 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Hover hint ── */
  .fleet-hover-hint {
    font-size: 10px;
    color: #A8A29E;
    text-align: center;
    padding: 6px 14px 10px;
    letter-spacing: 0.03em;
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .fleet-card-inner { transition: none; }
  }
`;

// Inject styles once
if (!document.getElementById("fleet-showcase-styles")) {
  const tag = document.createElement("style");
  tag.id = "fleet-showcase-styles";
  tag.innerHTML = styles;
  document.head.appendChild(tag);
}