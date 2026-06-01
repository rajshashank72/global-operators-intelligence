// ─────────────────────────────────────────────────────────────────────────────
// ASR Aviation — Rate Card (2026 Market Rates)
// Source: BLADE, BlackJet, Paramount Business Jets, JetFinder research
//
// IMPORTANT: aircraftRateUSD is the ALL-IN charter rate per hour.
// It already includes: aircraft lease + crew salaries + basic ops.
// pilotCaptainRate & pilotFORate are SEPARATE crew fees charged ON TOP
// only for: positioning flights, multi-day trips, or owner-operated aircraft.
// For standard charter quotes, we use a flat crew fee % of aircraft rate.
// ─────────────────────────────────────────────────────────────────────────────

export const AIRCRAFT_RATES = [
  {
    type: 'Turboprop',
    examples: 'King Air 350, PC-12, TBM 960',
    aircraftRateUSD: 2500,       // all-in charter rate/hr (2026)
    crewFeePercent: 0.08,        // 8% of aircraft rate = crew overhead
    pilots: 2,
    cruiseSpeed: 450,
    fuelBurnLph: 280,
  },
  {
    type: 'Very Light Jet',
    examples: 'Citation Mustang, Phenom 100',
    aircraftRateUSD: 3500,
    crewFeePercent: 0.08,
    pilots: 1,
    cruiseSpeed: 700,
    fuelBurnLph: 380,
  },
  {
    type: 'Light Jet',
    examples: 'Citation CJ2+, Premier 1A, Lear 40',
    aircraftRateUSD: 4500,
    crewFeePercent: 0.09,
    pilots: 2,
    cruiseSpeed: 750,
    fuelBurnLph: 450,
  },
  {
    type: 'Midsize Jet',
    examples: 'Citation XLS, Hawker 800, Lear 60',
    aircraftRateUSD: 6500,
    crewFeePercent: 0.09,
    pilots: 2,
    cruiseSpeed: 830,
    fuelBurnLph: 600,
  },
  {
    type: 'Super Midsize Jet',
    examples: 'Challenger 300, Falcon 2000, Citation X',
    aircraftRateUSD: 8500,
    crewFeePercent: 0.10,
    pilots: 2,
    cruiseSpeed: 900,
    fuelBurnLph: 750,
  },
  {
    type: 'Heavy Jet',
    examples: 'Global 6000, G550, Falcon 7X',
    aircraftRateUSD: 12000,
    crewFeePercent: 0.10,
    pilots: 2,
    cruiseSpeed: 950,
    fuelBurnLph: 950,
  },
  {
    type: 'Ultra Long Range',
    examples: 'Global 7500, G700, Falcon 10X',
    aircraftRateUSD: 17000,
    crewFeePercent: 0.11,
    pilots: 2,
    cruiseSpeed: 980,
    fuelBurnLph: 1100,
  },
  {
    type: 'Helicopter (Light)',
    examples: 'Bell 206, AS350, EC130',
    aircraftRateUSD: 1800,
    crewFeePercent: 0.08,
    pilots: 1,
    cruiseSpeed: 220,
    fuelBurnLph: 180,
  },
  {
    type: 'Helicopter (Medium)',
    examples: 'AW139, Bell 412, Sikorsky S-76',
    aircraftRateUSD: 3200,
    crewFeePercent: 0.09,
    pilots: 2,
    cruiseSpeed: 280,
    fuelBurnLph: 350,
  },
  {
    type: 'Helicopter (Heavy)',
    examples: 'Mi-172, CH-47, Sikorsky S-92',
    aircraftRateUSD: 5000,
    crewFeePercent: 0.10,
    pilots: 2,
    cruiseSpeed: 260,
    fuelBurnLph: 550,
  },
];

// Ground transport (cab) from airport to city center
export const CAB_CHARGES_USD = 150;
export const MARGIN = 1.07; // ASR Aviation fixed 7% profit margin
export const USD_TO_INR = 95; // Updated exchange rate
export const GST_INDIA = 0.18; // 18% GST for India routes
export const GST_INTERNATIONAL = 0.05; // 5% GST for international routes

// Airport landing + FBO handling fees (USD) — per airport, both departure & arrival
// Source: Paramount Business Jets, SimpleFlying 2026 research
export const AIRPORT_CHARGES = {
  tier1: 1200,   // Major hubs: New York, London, Dubai, Mumbai, Paris, Frankfurt
  tier2: 700,    // Secondary: Manchester, Bangalore, Sharjah, Chicago, Dallas
  tier3: 350,    // Smaller/regional airports
};