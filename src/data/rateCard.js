// ─────────────────────────────────────────────────────────────────────────────
// ASR Aviation — Rate Card (2026 Market Rates)
// Sources: Amalfi Jets, BlackJet, Jettly, Paramount Business Jets (2026)
// Aircraft specs: Manufacturer data + GlobalAir.com verified
// Last updated: June 2026
// ─────────────────────────────────────────────────────────────────────────────

export const AIRCRAFT_RATES = [
  {
    type: 'Turboprop',
    examples: 'King Air 350, PC-12, TBM 960',
    aircraftRateUSD: 2200,
    crewFeePercent: 0.08,
    pilots: 2,
    cruiseSpeed: 561,
    fuelBurnLph: 360,
    maxRangeKm: 3344,
    maxFlightHours: 7,
  },
  {
    type: 'Very Light Jet',
    examples: 'Citation Mustang, Phenom 100, Eclipse 550',
    aircraftRateUSD: 2500,
    crewFeePercent: 0.08,
    pilots: 1,
    cruiseSpeed: 722,
    fuelBurnLph: 340,
    maxRangeKm: 2037,
    maxFlightHours: 3,
  },
  {
    type: 'Light Jet',
    examples: 'Citation CJ4, Phenom 300E, Lear 45',
    aircraftRateUSD: 4000,
    crewFeePercent: 0.09,
    pilots: 2,
    cruiseSpeed: 778,
    fuelBurnLph: 430,
    maxRangeKm: 3706,
    maxFlightHours: 5,
  },
  {
    type: 'Midsize Jet',
    examples: 'Citation XLS+, Hawker 900XP, Lear 60XR',
    aircraftRateUSD: 5500,
    crewFeePercent: 0.09,
    pilots: 2,
    cruiseSpeed: 833,
    fuelBurnLph: 590,
    maxRangeKm: 3519,
    maxFlightHours: 5,
  },
  {
    type: 'Super Midsize Jet',
    examples: 'Challenger 350, Falcon 2000LXS, Citation X+',
    aircraftRateUSD: 7500,
    crewFeePercent: 0.10,
    pilots: 2,
    cruiseSpeed: 908,
    fuelBurnLph: 760,
    maxRangeKm: 5926,
    maxFlightHours: 7,
  },
  {
    type: 'Heavy Jet',
    examples: 'Global 6500, G550, Falcon 7X',
    aircraftRateUSD: 11000,
    crewFeePercent: 0.10,
    pilots: 2,
    cruiseSpeed: 956,
    fuelBurnLph: 1136,
    maxRangeKm: 12223,
    maxFlightHours: 14,
  },
  {
    type: 'Ultra Long Range',
    examples: 'Global 7500, G700, Falcon 10X',
    aircraftRateUSD: 17000,
    crewFeePercent: 0.11,
    pilots: 2,
    cruiseSpeed: 956,
    fuelBurnLph: 1866,
    maxRangeKm: 14353,
    maxFlightHours: 17,
  },
  {
    type: 'Helicopter (Light)',
    examples: 'Bell 407, AS350 B3, EC130 T2',
    aircraftRateUSD: 2000,
    crewFeePercent: 0.08,
    pilots: 1,
    cruiseSpeed: 248,
    fuelBurnLph: 189,
    maxRangeKm: 611,
    maxFlightHours: 3,
  },
  {
    type: 'Helicopter (Medium)',
    examples: 'AW139, Bell 412, Sikorsky S-76D',
    aircraftRateUSD: 4000,
    crewFeePercent: 0.09,
    pilots: 2,
    cruiseSpeed: 306,
    fuelBurnLph: 530,
    maxRangeKm: 1000,
    maxFlightHours: 4,
  },
  {
    type: 'Helicopter (Heavy)',
    examples: 'Sikorsky S-92, AW101, Mi-8/Mi-172',
    aircraftRateUSD: 6000,
    crewFeePercent: 0.10,
    pilots: 2,
    cruiseSpeed: 278,
    fuelBurnLph: 757,
    maxRangeKm: 1000,
    maxFlightHours: 4,
  },
];

export const CAB_CHARGES_USD = 150;
export const MARGIN = 1.07;
export const USD_TO_INR = 95;
export const GST_INDIA = 0.18;
export const GST_INTERNATIONAL = 0.05;

export const AIRPORT_CHARGES = {
  tier1: 1200,
  tier2: 700,
  tier3: 350,
};