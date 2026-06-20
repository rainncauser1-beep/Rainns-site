// Per-trade accent helpers. Each vertical has one signature hex (see
// src/config/verticals.js). We expose it as CSS custom properties so Tailwind
// arbitrary-value classes (e.g. text-[color:var(--accent)]) can use it without
// fighting the JIT purge. Kept subtle on purpose — the cream + navy base stays.

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function mix(hex, target, amt) {
  const c = hexToRgb(hex);
  const t = hexToRgb(target);
  const m = (k) => Math.round(c[k] + (t[k] - c[k]) * amt);
  return `rgb(${m("r")}, ${m("g")}, ${m("b")})`;
}

export const lighten = (hex, amt) => mix(hex, "#ffffff", amt);
export const darken = (hex, amt) => mix(hex, "#0b1220", amt);

// Style object of CSS vars for a wrapper element.
export function accentVars(hex) {
  const safe = hex || "#15325a";
  return {
    "--accent": safe,
    "--accent-strong": darken(safe, 0.18),
    "--accent-light": lighten(safe, 0.5),
    "--accent-soft": rgba(safe, 0.12),
    "--accent-softer": rgba(safe, 0.06),
    "--accent-pale": rgba(safe, 0.28),
    "--accent-border": rgba(safe, 0.35),
  };
}
