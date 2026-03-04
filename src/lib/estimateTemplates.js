import { uid } from "../theme/styles.js";

function makeLine(description, unit = "ea") {
  return {
    id: uid(),
    description,
    quantity: 1,
    unit,
    unitRate: 0,
    costTotal: 0,
    marginPercent: 20,
    sellTotal: 0,
  };
}

function makeCategory(name, items = []) {
  return {
    id: uid(),
    name,
    items,
  };
}

export const ESTIMATE_TEMPLATE_OPTIONS = [
  { id: "basic_residential", label: "Basic Residential" },
  { id: "residential", label: "Residential Build" },
  { id: "extension", label: "Extension" },
  { id: "renovation", label: "Renovation" },
  { id: "kitchen_remodel", label: "Kitchen Remodel" },
  { id: "custom", label: "Custom (blank)" },
];

const TEMPLATE_DEFINITIONS = {
  basic_residential: [
    makeCategory("Preliminaries"),
    makeCategory("Demo / Site Prep"),
    makeCategory("Concrete"),
    makeCategory("Framing"),
    makeCategory("Roofing"),
    makeCategory("Electrical"),
    makeCategory("Plumbing"),
    makeCategory("HVAC"),
    makeCategory("Insulation"),
    makeCategory("Plaster"),
    makeCategory("Flooring"),
    makeCategory("Cabinets"),
    makeCategory("Painting"),
    makeCategory("External Works"),
    makeCategory("PC/Provisional Sums"),
    makeCategory("Margin / Adjustments"),
  ],
  residential: [
    makeCategory("Preliminaries"),
    makeCategory("Site Works"),
    makeCategory("Concrete"),
    makeCategory("Framing"),
    makeCategory("Roofing"),
    makeCategory("Windows & Doors"),
    makeCategory("Electrical", [
      makeLine("Switches"),
      makeLine("Lighting"),
      makeLine("Power points"),
      makeLine("Main board"),
    ]),
    makeCategory("Plumbing"),
    makeCategory("HVAC"),
    makeCategory("Insulation"),
    makeCategory("Drywall"),
    makeCategory("Flooring"),
    makeCategory("Joinery"),
    makeCategory("Painting"),
    makeCategory("Landscaping"),
    makeCategory("Contingency", [makeLine("Allowance", "sum")]),
  ],
  extension: [
    makeCategory("Preliminaries"),
    makeCategory("Demolition"),
    makeCategory("Footings & Slab"),
    makeCategory("Framing"),
    makeCategory("Roofing"),
    makeCategory("Windows & Doors"),
    makeCategory("Electrical", [makeLine("Switches"), makeLine("Lighting"), makeLine("Power points"), makeLine("Main board")]),
    makeCategory("Plumbing"),
    makeCategory("Finishes"),
    makeCategory("Contingency", [makeLine("Allowance", "sum")]),
  ],
  renovation: [
    makeCategory("Preliminaries"),
    makeCategory("Demolition"),
    makeCategory("Structural"),
    makeCategory("Electrical", [makeLine("Switches"), makeLine("Lighting"), makeLine("Power points"), makeLine("Main board")]),
    makeCategory("Plumbing"),
    makeCategory("Joinery"),
    makeCategory("Painting"),
    makeCategory("Flooring"),
    makeCategory("Contingency", [makeLine("Allowance", "sum")]),
  ],
  kitchen_remodel: [
    makeCategory("Preliminaries"),
    makeCategory("Demolition"),
    makeCategory("Cabinetry", [makeLine("Base cabinets"), makeLine("Overhead cabinets"), makeLine("Pantry")]),
    makeCategory("Benchtops", [makeLine("Stone benchtop", "m2")]),
    makeCategory("Electrical", [makeLine("Switches"), makeLine("Lighting"), makeLine("Power points"), makeLine("Main board")]),
    makeCategory("Plumbing", [makeLine("Sink and mixer"), makeLine("Appliance connections")]),
    makeCategory("Appliances"),
    makeCategory("Splashback", [makeLine("Tiles", "m2")]),
    makeCategory("Painting"),
    makeCategory("Contingency", [makeLine("Allowance", "sum")]),
  ],
  custom: [],
};

export function buildEstimateTemplate(templateId) {
  const list = TEMPLATE_DEFINITIONS[templateId] || TEMPLATE_DEFINITIONS.custom;
  return list.map((cat) => ({
    ...cat,
    id: uid(),
    items: (cat.items || []).map((item) => ({ ...item, id: uid() })),
  }));
}
