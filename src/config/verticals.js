// Source of truth for the multi-vertical "big tree".
//
//   koemori.ai/            -> Landing (brand hub + trade picker)
//   koemori.ai/roofing     -> Home.jsx (bespoke, original — a live client relies on it)
//   koemori.ai/<slug>      -> Vertical.jsx (config-driven template, copy from vertical-content.js)
//
// To add a trade: add a META entry + an ORDER slot here, and a copy block in
// vertical-content.js. No new page component required.

import {
  Hammer, Sprout, Droplets, Car, Thermometer,
  Wrench, Zap, DoorOpen, Bug, Trees,
} from "lucide-react";
import { CONTENT } from "./vertical-content";

// Shared demo agent. New verticals reuse the roofing-tuned agent for now and
// pass their `trade` so it greets in-context; per-vertical demo agents land later.
const DEFAULT_DEMO_AGENT = "agent_d5de35910a5d71b79710fb5d8b";

// Structural meta. `bespoke: true` => routed to its own page, not the template.
// `featured: true` => shown on the homepage. Everything else lives on /services.
const META = {
  roofing: {
    label: "Roofing", navLabel: "Roofing", icon: Hammer, bespoke: true, to: "/roofing", featured: true,
    accent: "#15325a",
    card: {
      blurb: "Storm season, on a roof, after hours — every call answered, every estimate booked.",
      statV: "<3s", statL: "Pickup speed",
    },
    example: {
      caller: "I've got water coming through my ceiling after last night's storm",
      outcome: "Booked an emergency inspection.",
    },
    tradeOptions: [
      "residential roofing", "commercial roofing", "storm & restoration",
      "repair & maintenance", "mixed / full-service",
    ],
  },
  lawncare:        { label: "Lawn Care",        navLabel: "Lawn Care",     icon: Sprout,      featured: true, accent: "#4f8a3f" },
  pressurewashing: { label: "Pressure Washing", navLabel: "Pressure Wash", icon: Droplets,                    accent: "#2d7d8f" },
  detailing:       { label: "Auto Detailing",   navLabel: "Detailing",     icon: Car,                         accent: "#6a4f9c" },
  hvac:            { label: "HVAC",             navLabel: "HVAC",          icon: Thermometer, featured: true, accent: "#c2622e" },
  plumbing:        { label: "Plumbing",         navLabel: "Plumbing",      icon: Wrench,      featured: true, accent: "#2f6fb0" },
  electrical:      { label: "Electrical",       navLabel: "Electrical",    icon: Zap,                         accent: "#b5882c" },
  garagedoors:     { label: "Garage Doors",     navLabel: "Garage Doors",  icon: DoorOpen,                    accent: "#566270" },
  pestcontrol:     { label: "Pest Control",     navLabel: "Pest Control",  icon: Bug,                         accent: "#9c5a3c" },
  landscaping:     { label: "Landscaping",      navLabel: "Landscaping",   icon: Trees,                       accent: "#2f6b4a" },
};

// Drives picker-grid + footer order. Roofing first (the flagship).
const ORDER = [
  "roofing", "lawncare", "pressurewashing", "detailing", "hvac",
  "plumbing", "electrical", "garagedoors", "pestcontrol", "landscaping",
];

export const VERTICALS = ORDER.map((slug) => {
  const meta = META[slug];
  const content = CONTENT[slug] || null;
  const live = meta.bespoke || !!content;
  return {
    slug,
    to: meta.to || `/${slug}`,
    icon: meta.icon,
    label: meta.label,
    navLabel: meta.navLabel || meta.label,
    bespoke: !!meta.bespoke,
    demoAgentId: meta.demoAgentId || DEFAULT_DEMO_AGENT,
    status: live ? "live" : "coming-soon",
    featured: !!meta.featured,
    accent: meta.accent || "#15325a",
    // Landing-card fields: bespoke verticals carry their own; template verticals
    // borrow from their content block.
    card: meta.card || content?.card || null,
    // Live-call example for the /services directory cards.
    example: meta.example || content?.example || null,
    // Specialty options for onboarding / admin (per-trade focus list).
    tradeOptions: meta.tradeOptions || content?.tradeOptions || [],
    content,
  };
});

export const VERTICALS_BY_SLUG = Object.fromEntries(VERTICALS.map((v) => [v.slug, v]));

// Verticals that have a real, viewable page right now (for the picker + nav).
export const LIVE_VERTICALS = VERTICALS.filter((v) => v.status === "live");

// Subset shown on the homepage; the rest live on /services.
export const FEATURED_VERTICALS = VERTICALS.filter((v) => v.featured && v.status === "live");

export function getVertical(slug) {
  return VERTICALS_BY_SLUG[slug] || null;
}

// First path segment -> active vertical (null on brand/utility pages).
// "/lawncare" -> lawncare; "/roofing/features" -> roofing; "/" -> null.
export function verticalFromPath(pathname) {
  const seg = (pathname || "/").split("/").filter(Boolean)[0];
  return seg ? getVertical(seg) : null;
}
