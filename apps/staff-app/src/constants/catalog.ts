import { Ionicons } from "@expo/vector-icons";

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  basePrice: number;
  visitCharge: number;
  taxPercent: number;
  durationMins: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  popular: boolean;
  includes: string[];
}

export const SERVICE_CATALOG: CatalogItem[] = [
  {
    id: "panel_cleaning",
    name: "Solar Panel Cleaning",
    category: "Cleaning",
    tagline: "Restore your panels to peak efficiency",
    description:
      "Professional cleaning using purified water and soft brushes. Removes dust, bird droppings, and grime that reduce energy output by up to 30%.",
    basePrice: 499,
    visitCharge: 50,
    taxPercent: 18,
    durationMins: 90,
    icon: "water-outline",
    color: "#06b6d4",
    bg: "#ecfeff",
    popular: true,
    includes: [
      "Panel inspection",
      "Purified water wash",
      "Post-clean efficiency check",
      "Digital service report",
    ],
  },
  {
    id: "maintenance",
    name: "Preventive Maintenance",
    category: "Maintenance",
    tagline: "Full system health checkup",
    description:
      "Comprehensive inspection of inverter, wiring, mounting structure, and panel performance with detailed optimization recommendations.",
    basePrice: 799,
    visitCharge: 50,
    taxPercent: 18,
    durationMins: 120,
    icon: "construct-outline",
    color: "#3b82f6",
    bg: "#eff6ff",
    popular: false,
    includes: [
      "Inverter diagnostics",
      "Wiring inspection",
      "Panel performance test",
      "Cleaning included",
    ],
  },
  {
    id: "inspection",
    name: "System Inspection",
    category: "Inspection",
    tagline: "Detailed health report for your system",
    description:
      "In-depth inspection covering all solar components with a comprehensive PDF health report delivered directly to your phone.",
    basePrice: 399,
    visitCharge: 50,
    taxPercent: 18,
    durationMins: 60,
    icon: "search-outline",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    popular: false,
    includes: [
      "Panel condition report",
      "Inverter diagnostics",
      "PDF health report",
      "Recommendations list",
    ],
  },
  {
    id: "emergency",
    name: "Emergency Repair",
    category: "Emergency",
    tagline: "Priority response for urgent faults",
    description:
      "Same-day or next-day priority response for system faults, inverter failures, unexpected shutdowns, or complete power loss.",
    basePrice: 999,
    visitCharge: 0,
    taxPercent: 18,
    durationMins: 180,
    icon: "warning-outline",
    color: "#ef4444",
    bg: "#fef2f2",
    popular: false,
    includes: [
      "Priority scheduling",
      "Fault diagnosis",
      "On-spot repair",
      "90-day repair warranty",
    ],
  },
  {
    id: "amc",
    name: "Annual Maintenance Contract",
    category: "AMC",
    tagline: "Year-round protection for your system",
    description:
      "4 scheduled maintenance visits per year with priority support, guaranteed response times, and free cleaning included in every visit.",
    basePrice: 2999,
    visitCharge: 0,
    taxPercent: 18,
    durationMins: 0,
    icon: "shield-checkmark-outline",
    color: "#16a34a",
    bg: "#f0fdf4",
    popular: true,
    includes: [
      "4 visits/year",
      "Priority scheduling",
      "Free cleaning every visit",
      "Annual system report",
    ],
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

export function calcPricing(item: CatalogItem) {
  const subtotal = item.basePrice + item.visitCharge;
  const tax = Math.round(subtotal * (item.taxPercent / 100));
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export const TIME_SLOTS = [
  "09:00 – 11:00 AM",
  "11:00 AM – 01:00 PM",
  "02:00 – 04:00 PM",
  "04:00 – 06:00 PM",
];
