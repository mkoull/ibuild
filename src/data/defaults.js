export const RATES = {
  "Preliminaries": [
    { item: "Site Establishment & Fencing", unit: "fixed", rate: 4500, qty: 1 },
    { item: "Temporary Amenities", unit: "fixed", rate: 3200, qty: 1 },
    { item: "Site Clean (Ongoing)", unit: "weeks", rate: 450, qty: 20 },
    { item: "Skip Bins & Waste", unit: "fixed", rate: 6500, qty: 1 },
    { item: "Surveyor", unit: "fixed", rate: 3500, qty: 1 },
    { item: "Engineer Inspections", unit: "fixed", rate: 4200, qty: 1 },
    { item: "Building Permit & Insurance", unit: "fixed", rate: 8500, qty: 1 },
  ],
  "Demolition & Earthworks": [
    { item: "Demolition (Partial)", unit: "m²", rate: 85, qty: 0 },
    { item: "Demolition (Full)", unit: "m²", rate: 55, qty: 0 },
    { item: "Site Cut & Fill", unit: "m³", rate: 45, qty: 0 },
    { item: "Excavation (Footings)", unit: "lm", rate: 65, qty: 0 },
    { item: "Retaining Walls", unit: "lm", rate: 320, qty: 0 },
  ],
  "Concrete & Slab": [
    { item: "Waffle Pod Slab", unit: "m²", rate: 165, qty: 0 },
    { item: "Raft Slab", unit: "m²", rate: 185, qty: 0 },
    { item: "Suspended Slab", unit: "m²", rate: 280, qty: 0 },
    { item: "Concrete Pumping", unit: "fixed", rate: 2800, qty: 0 },
    { item: "Screw Piles", unit: "each", rate: 550, qty: 0 },
  ],
  "Framing & Structure": [
    { item: "Timber Frame (Single)", unit: "m²", rate: 110, qty: 0 },
    { item: "Timber Frame (Double)", unit: "m²", rate: 135, qty: 0 },
    { item: "Steel Beams / Lintels", unit: "fixed", rate: 8500, qty: 0 },
    { item: "Roof Trusses", unit: "m²", rate: 75, qty: 0 },
  ],
  "Roofing & Cladding": [
    { item: "Colorbond Roofing", unit: "m²", rate: 68, qty: 0 },
    { item: "Tile Roofing", unit: "m²", rate: 85, qty: 0 },
    { item: "Fascia & Guttering", unit: "lm", rate: 55, qty: 0 },
    { item: "Render Cladding", unit: "m²", rate: 95, qty: 0 },
    { item: "Brick Veneer", unit: "m²", rate: 110, qty: 0 },
  ],
  "Windows & Doors": [
    { item: "Windows (Standard)", unit: "each", rate: 850, qty: 0 },
    { item: "Windows (Large)", unit: "each", rate: 2200, qty: 0 },
    { item: "Sliding Doors (3m)", unit: "each", rate: 3500, qty: 0 },
    { item: "Front Entry Door", unit: "each", rate: 3200, qty: 0 },
    { item: "Internal Doors", unit: "each", rate: 650, qty: 0 },
  ],
  "Electrical": [
    { item: "Rough-In", unit: "points", rate: 120, qty: 0 },
    { item: "Fit-Off", unit: "points", rate: 85, qty: 0 },
    { item: "Switchboard Upgrade", unit: "fixed", rate: 3200, qty: 0 },
    { item: "Downlights", unit: "each", rate: 95, qty: 0 },
  ],
  "Plumbing & Gas": [
    { item: "Rough-In", unit: "points", rate: 450, qty: 0 },
    { item: "Fit-Off", unit: "points", rate: 320, qty: 0 },
    { item: "Stormwater", unit: "fixed", rate: 5500, qty: 0 },
    { item: "Hot Water System", unit: "each", rate: 2400, qty: 0 },
  ],
  "Internal Linings": [
    { item: "Plasterboard", unit: "m²", rate: 42, qty: 0 },
    { item: "Insulation (Walls)", unit: "m²", rate: 18, qty: 0 },
    { item: "Cornices", unit: "lm", rate: 16, qty: 0 },
    { item: "Skirting & Architraves", unit: "lm", rate: 28, qty: 0 },
  ],
  "Kitchen": [
    { item: "Cabinetry (Premium)", unit: "lm", rate: 2200, qty: 0 },
    { item: "Stone Benchtop 40mm", unit: "lm", rate: 950, qty: 0 },
    { item: "Splashback", unit: "m²", rate: 180, qty: 0 },
    { item: "Appliances Allowance", unit: "fixed", rate: 8500, qty: 0 },
  ],
  "Bathroom & Ensuite": [
    { item: "Bathroom (Premium)", unit: "each", rate: 32000, qty: 0 },
    { item: "Ensuite (Premium)", unit: "each", rate: 28000, qty: 0 },
    { item: "Powder Room", unit: "each", rate: 9500, qty: 0 },
    { item: "Waterproofing", unit: "m²", rate: 65, qty: 0 },
  ],
  "Painting & Finishes": [
    { item: "Internal Paint", unit: "m²", rate: 18, qty: 0 },
    { item: "External Paint", unit: "m²", rate: 28, qty: 0 },
    { item: "Timber Flooring", unit: "m²", rate: 120, qty: 0 },
    { item: "Carpet", unit: "m²", rate: 65, qty: 0 },
  ],
  "External & Landscaping": [
    { item: "Driveway (Concrete)", unit: "m²", rate: 110, qty: 0 },
    { item: "Decking (Merbau)", unit: "m²", rate: 280, qty: 0 },
    { item: "Fencing", unit: "lm", rate: 120, qty: 0 },
    { item: "Landscaping Allowance", unit: "fixed", rate: 15000, qty: 0 },
  ],
};

export const MILESTONES = [
  { name: "Deposit", wk: 0, durationDays: 28 },
  { name: "Permits Approved", wk: 4, durationDays: 28 },
  { name: "Slab Poured", wk: 8, durationDays: 28 },
  { name: "Frame Up", wk: 12, durationDays: 42 },
  { name: "Lock Up", wk: 18, durationDays: 28 },
  { name: "Rough-In Complete", wk: 22, durationDays: 42 },
  { name: "Fix Stage", wk: 28, durationDays: 42 },
  { name: "Practical Completion", wk: 34, durationDays: 14 },
  { name: "Handover", wk: 36, durationDays: 7 },
];

export const STAGES = ["Lead", "Quoted", "Approved", "Active", "Invoiced", "Complete"];

// Legacy stages for migration compat
export const LEGACY_STAGES = ["Lead", "Quote", "Approved", "Active", "Invoiced", "Complete"];

export const WEATHER = ["Clear", "Partly Cloudy", "Overcast", "Rain", "Storm"];
