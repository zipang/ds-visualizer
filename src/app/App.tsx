import React, { useState, useRef, useEffect, useCallback } from "react";
import { Settings, Upload, Download, RotateCcw, X, HelpCircle } from "lucide-react";

/* ── Utilities ──────────────────────────────────────────────────────────────── */

function toLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLum(hex: string): number {
  if (!hex || hex.length < 7) return 0;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function cr(fg: string, bg: string): number {
  const l1 = getLum(fg), l2 = getLum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function isLight(hex: string): boolean {
  return getLum(hex) > 0.35;
}

function typeSteps(base: number, ratio: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.round(base * Math.pow(ratio, n - 1 - i) * 10) / 10
  );
}

function spacingSteps(base: number, type: "geo" | "arith", ratio: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    type === "geo"
      ? Math.round(base * Math.pow(ratio, i) * 10) / 10
      : Math.round((base + ratio * i) * 10) / 10
  );
}

function parseCSSVars(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) vars[`--${m[1].trim()}`] = m[2].trim();
  return vars;
}

/* ── Google Fonts Catalog ─────────────────────────────────────────────────── */

interface GFontEntry { family: string; category: "serif" | "sans-serif" | "display" | "monospace" | "handwriting" }

const GOOGLE_FONTS: GFontEntry[] = [
  // Serif
  { family: "DM Serif Display",       category: "serif" },
  { family: "DM Serif Text",          category: "serif" },
  { family: "Playfair Display",       category: "serif" },
  { family: "Playfair Display SC",    category: "serif" },
  { family: "Merriweather",           category: "serif" },
  { family: "Lora",                   category: "serif" },
  { family: "PT Serif",               category: "serif" },
  { family: "Crimson Text",           category: "serif" },
  { family: "Crimson Pro",            category: "serif" },
  { family: "EB Garamond",            category: "serif" },
  { family: "Libre Baskerville",      category: "serif" },
  { family: "Cormorant Garamond",     category: "serif" },
  { family: "Cormorant",              category: "serif" },
  { family: "Vollkorn",               category: "serif" },
  { family: "Alegreya",               category: "serif" },
  { family: "Spectral",               category: "serif" },
  { family: "Fraunces",               category: "serif" },
  { family: "Bodoni Moda",            category: "serif" },
  { family: "Cardo",                  category: "serif" },
  { family: "Domine",                 category: "serif" },
  { family: "Frank Ruhl Libre",       category: "serif" },
  { family: "Literata",               category: "serif" },
  { family: "Source Serif 4",         category: "serif" },
  { family: "Noto Serif",             category: "serif" },
  { family: "Arvo",                   category: "serif" },
  { family: "Bitter",                 category: "serif" },
  { family: "Rokkitt",                category: "serif" },
  { family: "Zilla Slab",             category: "serif" },
  { family: "Josefin Slab",           category: "serif" },
  { family: "Libre Caslon Text",      category: "serif" },
  { family: "Unna",                   category: "serif" },
  { family: "Cinzel",                 category: "serif" },
  { family: "Vidaloka",               category: "serif" },
  { family: "Neuton",                 category: "serif" },
  { family: "Tinos",                  category: "serif" },
  // Sans-serif
  { family: "Plus Jakarta Sans",      category: "sans-serif" },
  { family: "Inter",                  category: "sans-serif" },
  { family: "Roboto",                 category: "sans-serif" },
  { family: "Roboto Condensed",       category: "sans-serif" },
  { family: "Open Sans",              category: "sans-serif" },
  { family: "Lato",                   category: "sans-serif" },
  { family: "Montserrat",             category: "sans-serif" },
  { family: "Nunito",                 category: "sans-serif" },
  { family: "Nunito Sans",            category: "sans-serif" },
  { family: "Raleway",                category: "sans-serif" },
  { family: "Poppins",                category: "sans-serif" },
  { family: "Outfit",                 category: "sans-serif" },
  { family: "DM Sans",                category: "sans-serif" },
  { family: "Figtree",                category: "sans-serif" },
  { family: "Sora",                   category: "sans-serif" },
  { family: "Manrope",                category: "sans-serif" },
  { family: "Work Sans",              category: "sans-serif" },
  { family: "Source Sans 3",          category: "sans-serif" },
  { family: "IBM Plex Sans",          category: "sans-serif" },
  { family: "Jost",                   category: "sans-serif" },
  { family: "Urbanist",               category: "sans-serif" },
  { family: "Rubik",                  category: "sans-serif" },
  { family: "Karla",                  category: "sans-serif" },
  { family: "Mulish",                 category: "sans-serif" },
  { family: "Quicksand",              category: "sans-serif" },
  { family: "Cabin",                  category: "sans-serif" },
  { family: "Barlow",                 category: "sans-serif" },
  { family: "Barlow Condensed",       category: "sans-serif" },
  { family: "Noto Sans",              category: "sans-serif" },
  { family: "Ubuntu",                 category: "sans-serif" },
  { family: "Exo 2",                  category: "sans-serif" },
  { family: "Fira Sans",              category: "sans-serif" },
  { family: "Assistant",              category: "sans-serif" },
  { family: "Heebo",                  category: "sans-serif" },
  { family: "Titillium Web",          category: "sans-serif" },
  { family: "Josefin Sans",           category: "sans-serif" },
  { family: "Varela Round",           category: "sans-serif" },
  { family: "Maven Pro",              category: "sans-serif" },
  { family: "Be Vietnam Pro",         category: "sans-serif" },
  { family: "Lexend",                 category: "sans-serif" },
  { family: "Lexend Deca",            category: "sans-serif" },
  { family: "Albert Sans",            category: "sans-serif" },
  { family: "Onest",                  category: "sans-serif" },
  { family: "Bricolage Grotesque",    category: "sans-serif" },
  { family: "Hanken Grotesk",         category: "sans-serif" },
  { family: "Schibsted Grotesk",      category: "sans-serif" },
  { family: "Instrument Sans",        category: "sans-serif" },
  { family: "Geist",                  category: "sans-serif" },
  // Display
  { family: "Bebas Neue",             category: "display" },
  { family: "Anton",                  category: "display" },
  { family: "Oswald",                 category: "display" },
  { family: "Righteous",              category: "display" },
  { family: "Bungee",                 category: "display" },
  { family: "Alfa Slab One",          category: "display" },
  { family: "Abril Fatface",          category: "display" },
  { family: "Black Ops One",          category: "display" },
  { family: "Teko",                   category: "display" },
  { family: "Russo One",              category: "display" },
  { family: "Squada One",             category: "display" },
  { family: "Big Shoulders Display",  category: "display" },
  { family: "Big Shoulders Text",     category: "display" },
  { family: "Syne",                   category: "display" },
  { family: "Instrument Serif",       category: "display" },
  { family: "Cormorant SC",           category: "display" },
  { family: "Yeseva One",             category: "display" },
  { family: "Ultra",                  category: "display" },
  { family: "Boogaloo",               category: "display" },
  // Monospace
  { family: "JetBrains Mono",         category: "monospace" },
  { family: "Fira Code",              category: "monospace" },
  { family: "Source Code Pro",        category: "monospace" },
  { family: "IBM Plex Mono",          category: "monospace" },
  { family: "Space Mono",             category: "monospace" },
  { family: "DM Mono",                category: "monospace" },
  { family: "Roboto Mono",            category: "monospace" },
  { family: "Cousine",                category: "monospace" },
  { family: "Inconsolata",            category: "monospace" },
  { family: "Noto Sans Mono",         category: "monospace" },
  { family: "Ubuntu Mono",            category: "monospace" },
  { family: "Anonymous Pro",          category: "monospace" },
  { family: "Overpass Mono",          category: "monospace" },
  { family: "Share Tech Mono",        category: "monospace" },
  { family: "Chivo Mono",             category: "monospace" },
  { family: "Azeret Mono",            category: "monospace" },
  // Handwriting
  { family: "Dancing Script",         category: "handwriting" },
  { family: "Pacifico",               category: "handwriting" },
  { family: "Caveat",                 category: "handwriting" },
  { family: "Satisfy",                category: "handwriting" },
  { family: "Kalam",                  category: "handwriting" },
  { family: "Patrick Hand",           category: "handwriting" },
  { family: "Permanent Marker",       category: "handwriting" },
  { family: "Shadows Into Light",     category: "handwriting" },
  { family: "Amatic SC",              category: "handwriting" },
  { family: "Indie Flower",           category: "handwriting" },
  { family: "Gloria Hallelujah",      category: "handwriting" },
  { family: "Architects Daughter",    category: "handwriting" },
  { family: "Yellowtail",             category: "handwriting" },
  { family: "Bad Script",             category: "handwriting" },
];

const SYSTEM_FONTS: GFontEntry[] = [
  { family: "Arial",           category: "sans-serif" },
  { family: "Helvetica Neue",  category: "sans-serif" },
  { family: "Verdana",         category: "sans-serif" },
  { family: "Trebuchet MS",    category: "sans-serif" },
  { family: "Georgia",         category: "serif" },
  { family: "Times New Roman", category: "serif" },
  { family: "Palatino",        category: "serif" },
  { family: "Garamond",        category: "serif" },
  { family: "Courier New",     category: "monospace" },
  { family: "Lucida Console",  category: "monospace" },
  { family: "Impact",          category: "display" },
  { family: "Comic Sans MS",   category: "handwriting" },
];

const _loadedFonts = new Set<string>();

function loadGoogleFont(family: string): void {
  if (_loadedFonts.has(family)) return;
  _loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700&display=block`;
  document.head.appendChild(link);
}

/* ── Types & Defaults ──────────────────────────────────────────────────────── */

interface TypeTrack {
  fontFamily: string;
  base: number;
  ratio: number;
  steps: number;
  lineHeight: number;
  weight: number;
}

interface DS {
  headings: TypeTrack;
  body: TypeTrack;
  mono: TypeTrack;
  brand: { accent: string; primary: string; secondary: string; tertiary: string };
  action: { success: string; warning: string; info: string; danger: string };
  textCol: { body: string; accent: string; muted: string; ondark: string };
  surface: { base: string; alt: string; dark: string; card: string };
  spacing: { base: number; type: "geo" | "arith"; ratio: number; steps: number };
  radii: { name: string; value: number }[];
  elevations: { name: string; blur: number; spread: number; y: number; opacity: number }[];
}

const INIT: DS = {
  headings: { fontFamily: "DM Serif Display", base: 16, ratio: 1.333, steps: 7, lineHeight: 1.12, weight: 400 },
  body: { fontFamily: "Plus Jakarta Sans", base: 14, ratio: 1.25, steps: 5, lineHeight: 1.65, weight: 400 },
  mono: { fontFamily: "JetBrains Mono", base: 13, ratio: 1.2, steps: 4, lineHeight: 1.55, weight: 400 },
  brand: { accent: "#2D2DFF", primary: "#0A0A0F", secondary: "#5B4FE9", tertiary: "#E94F7E" },
  action: { success: "#16A34A", warning: "#D97706", info: "#0EA5E9", danger: "#DC2626" },
  textCol: { body: "#0C0C0A", accent: "#2D2DFF", muted: "#6B7280", ondark: "#F0EFEA" },
  surface: { base: "#F2F1ED", alt: "#E4E3DE", dark: "#0C0C0A", card: "#FFFFFF" },
  spacing: { base: 4, type: "geo", ratio: 2, steps: 8 },
  radii: [
    { name: "none", value: 0 }, { name: "xs", value: 2 }, { name: "sm", value: 4 },
    { name: "md", value: 8 }, { name: "lg", value: 12 }, { name: "xl", value: 16 },
    { name: "2xl", value: 24 }, { name: "full", value: 9999 },
  ],
  elevations: [
    { name: "0", blur: 0, spread: 0, y: 0, opacity: 0 },
    { name: "1", blur: 4, spread: 0, y: 1, opacity: 0.06 },
    { name: "2", blur: 8, spread: -2, y: 2, opacity: 0.1 },
    { name: "3", blur: 16, spread: -4, y: 4, opacity: 0.12 },
    { name: "4", blur: 32, spread: -8, y: 8, opacity: 0.16 },
    { name: "5", blur: 64, spread: -16, y: 16, opacity: 0.2 },
  ],
};

const TOKEN_GUIDE = [
  ["--ds-heading-font", "\"DM Serif Display\""],
  ["--ds-heading-base", "16"],
  ["--ds-heading-ratio", "1.333"],
  ["--ds-heading-steps", "7"],
  ["--ds-body-font", "\"Plus Jakarta Sans\""],
  ["--ds-body-base", "14"],
  ["--ds-body-ratio", "1.25"],
  ["--ds-mono-font", "\"JetBrains Mono\""],
  ["--ds-color-brand-accent", "#2D2DFF"],
  ["--ds-color-brand-primary", "#0A0A0F"],
  ["--ds-color-brand-secondary", "#5B4FE9"],
  ["--ds-color-brand-tertiary", "#E94F7E"],
  ["--ds-color-action-success", "#16A34A"],
  ["--ds-color-action-warning", "#D97706"],
  ["--ds-color-action-info", "#0EA5E9"],
  ["--ds-color-action-danger", "#DC2626"],
  ["--ds-color-text-body", "#0C0C0A"],
  ["--ds-color-text-accent", "#2D2DFF"],
  ["--ds-color-text-muted", "#6B7280"],
  ["--ds-color-text-ondark", "#F0EFEA"],
  ["--ds-color-surface-base", "#F2F1ED"],
  ["--ds-color-surface-alt", "#E4E3DE"],
  ["--ds-color-surface-dark", "#0C0C0A"],
  ["--ds-color-surface-card", "#FFFFFF"],
  ["--ds-spacing-base", "4"],
  ["--ds-spacing-ratio", "2"],
  ["--ds-spacing-steps", "8"],
];

/* ── Primitive Components ──────────────────────────────────────────────────── */

function EditableText({
  value, onChange, className, style,
}: {
  value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current && ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => { focused.current = false; onChange(e.currentTarget.textContent ?? ""); }}
      className={`outline-none cursor-text rounded px-1 -mx-1 transition-colors hover:bg-black/5 focus:bg-black/5 ${className ?? ""}`}
      style={style}
    />
  );
}

function NInput({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number" value={value} min={min} max={max} step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-2 py-1 text-xs font-mono bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      style={{ border: "1px solid rgba(0,0,0,0.12)" }}
    />
  );
}

function TInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text" value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 text-xs bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      style={{ border: "1px solid rgba(0,0,0,0.12)" }}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>{label}</div>
      {children}
    </div>
  );
}

function CogPanel({ label, children, align = "left" }: {
  label: string; children: React.ReactNode; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        title={`${label} settings`}
        className="p-1.5 rounded transition-colors hover:bg-black/10"
        style={{ color: "rgba(0,0,0,0.35)" }}
      >
        <Settings size={13} />
      </button>
      {open && (
        <div
          className={`absolute top-8 z-50 bg-white rounded-lg shadow-2xl p-4 w-64 ${align === "right" ? "right-0" : "left-0"}`}
          style={{ border: "1px solid rgba(0,0,0,0.1)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs uppercase tracking-widest font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>{label}</span>
            <button onClick={() => setOpen(false)} className="hover:opacity-60" style={{ color: "rgba(0,0,0,0.35)" }}><X size={12} /></button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Font Picker ─────────────────────────────────────────────────────────── */

type GFontCategory = "all" | "serif" | "sans-serif" | "display" | "monospace" | "handwriting";
type FontProviderKey = "google" | "system" | "adobe";

const CAT_STYLE: Record<string, { bg: string; fg: string }> = {
  "serif":       { bg: "#FEF3C7", fg: "#92400E" },
  "sans-serif":  { bg: "#DBEAFE", fg: "#1E40AF" },
  "display":     { bg: "#EDE9FE", fg: "#5B21B6" },
  "monospace":   { bg: "#D1FAE5", fg: "#065F46" },
  "handwriting": { bg: "#FCE7F3", fg: "#9D174D" },
};

const CAT_LABEL: Record<string, string> = {
  "serif": "serif", "sans-serif": "sans", "display": "display",
  "monospace": "mono", "handwriting": "script",
};

function FontCard({ font, selected, onSelect, previewText }: {
  font: GFontEntry; selected: boolean; onSelect: () => void; previewText: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);
  const cs = CAT_STYLE[font.category] ?? { bg: "#F3F4F6", fg: "#374151" };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadGoogleFont(font.family);
          setTimeout(() => setLoaded(true), 120);
          obs.disconnect();
        }
      },
      { rootMargin: "160px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [font.family]);

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer"
      style={{
        backgroundColor: selected ? "#0C0C0A" : "transparent",
        border: `1.5px solid ${selected ? "#0C0C0A" : "rgba(0,0,0,0.08)"}`,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="font-mono truncate max-w-[72%]"
          style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)" }}
        >
          {font.family}
        </span>
        <span
          className="font-mono shrink-0"
          style={{
            fontSize: 9,
            backgroundColor: selected ? "rgba(255,255,255,0.14)" : cs.bg,
            color: selected ? "rgba(255,255,255,0.65)" : cs.fg,
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          {CAT_LABEL[font.category] ?? font.category}
        </span>
      </div>
      <div
        style={{
          fontFamily: loaded ? `"${font.family}", serif` : "inherit",
          fontSize: 18,
          lineHeight: 1.3,
          color: selected ? "#FFFFFF" : "#0C0C0A",
          minHeight: 26,
          opacity: loaded ? 1 : 0.25,
          transition: "opacity 0.25s",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {previewText || font.family}
      </div>
    </button>
  );
}

function FontPickerModal({ value, onChange, onClose }: {
  value: string; onChange: (family: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GFontCategory>("all");
  const [provider, setProvider] = useState<FontProviderKey>("google");
  const [preview, setPreview] = useState("The quick brown fox");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    loadGoogleFont(value);
    return () => clearTimeout(t);
  }, [value]);

  const allFonts = provider === "google" ? GOOGLE_FONTS : provider === "system" ? SYSTEM_FONTS : [];

  const filtered = allFonts.filter((f) =>
    f.family.toLowerCase().includes(search.toLowerCase()) &&
    (category === "all" || f.category === category)
  );

  const cats: { key: GFontCategory; label: string }[] = [
    { key: "all",         label: "All" },
    { key: "serif",       label: "Serif" },
    { key: "sans-serif",  label: "Sans" },
    { key: "display",     label: "Display" },
    { key: "monospace",   label: "Mono" },
    { key: "handwriting", label: "Script" },
  ];

  const providers: { key: FontProviderKey; label: string; count: number }[] = [
    { key: "google", label: "Google Fonts", count: GOOGLE_FONTS.length },
    { key: "system", label: "System",       count: SYSTEM_FONTS.length },
    { key: "adobe",  label: "Adobe Fonts",  count: 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-8"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: 700, height: "82vh", border: "1px solid rgba(0,0,0,0.1)", overflow: "hidden" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ fontFamily: "Plus Jakarta Sans, system-ui" }}>
              Font Picker
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>
              Current: <span style={{ fontFamily: `"${value}", serif`, fontSize: 13 }}>{value}</span>
            </div>
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search fonts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg focus:outline-none"
            style={{ border: "1px solid rgba(0,0,0,0.15)", width: 200, boxShadow: "0 0 0 0" }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px rgba(45,45,255,0.3)"; e.currentTarget.style.borderColor = "#2D2DFF"; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; }}
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-black/10 transition-colors cursor-pointer"
            style={{ color: "rgba(0,0,0,0.4)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Provider tabs */}
        <div
          className="flex shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", backgroundColor: "rgba(0,0,0,0.02)" }}
        >
          {providers.map((p) => (
            <button
              key={p.key}
              onClick={() => { if (p.key !== "adobe") { setProvider(p.key); setCategory("all"); } }}
              className={`relative px-5 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${p.key === "adobe" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"} ${provider === p.key ? "text-black" : "text-black/35 hover:text-black/60"}`}
            >
              {p.label}
              {p.count > 0 && (
                <span className="ml-1.5 font-mono" style={{ fontSize: 10, color: "rgba(0,0,0,0.22)" }}>
                  {p.count}
                </span>
              )}
              {provider === p.key && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-black" />
              )}
            </button>
          ))}
        </div>

        {/* Category filter + preview text */}
        <div
          className="flex items-center gap-2 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="flex gap-1.5 flex-1 flex-wrap">
            {cats.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className="px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors cursor-pointer"
                style={{
                  backgroundColor: category === c.key ? "#0C0C0A" : "rgba(0,0,0,0.06)",
                  color: category === c.key ? "#fff" : "rgba(0,0,0,0.5)",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            placeholder="Preview text…"
            className="px-2.5 py-1 text-xs rounded-lg focus:outline-none shrink-0"
            style={{ border: "1px solid rgba(0,0,0,0.12)", width: 170, color: "rgba(0,0,0,0.6)" }}
          />
        </div>

        {/* Font grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {provider === "adobe" ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="text-5xl font-light" style={{ fontFamily: "Georgia, serif", color: "rgba(0,0,0,0.15)" }}>Aa</div>
              <div className="text-sm font-semibold" style={{ fontFamily: "Plus Jakarta Sans, system-ui" }}>Adobe Fonts</div>
              <div className="text-xs leading-relaxed max-w-sm" style={{ color: "rgba(0,0,0,0.45)" }}>
                To use Adobe Fonts, add your Typekit embed URL to the project and type the font name directly in the Font Family field.
              </div>
              <div
                className="font-mono text-xs px-4 py-3 rounded-xl w-full max-w-sm text-left"
                style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                {`@import url("https://use.typekit.net/YOUR_KIT_ID.css");`}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: "rgba(0,0,0,0.3)" }}>
              <div className="text-sm">No fonts match</div>
              <div className="font-mono text-xs">"{search}"</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map((f) => (
                <FontCard
                  key={f.family}
                  font={f}
                  selected={value === f.family}
                  onSelect={() => { loadGoogleFont(f.family); onChange(f.family); onClose(); }}
                  previewText={preview}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
        >
          <span className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.28)" }}>
            {filtered.length} font{filtered.length !== 1 ? "s" : ""} · click to apply
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: "#0C0C0A", color: "#fff", fontFamily: "Plus Jakarta Sans, system-ui" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function FontFamilyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex gap-1">
        <div
          className="flex-1 min-w-0 px-2 py-1 text-xs rounded truncate"
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            fontFamily: `"${value}", system-ui`,
            backgroundColor: "rgba(0,0,0,0.02)",
            color: "#0C0C0A",
            lineHeight: "1.5",
          }}
        >
          {value}
        </div>
        <button
          onClick={() => setOpen(true)}
          title="Browse fonts"
          className="px-1.5 py-1 text-xs font-mono rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
          style={{ border: "1px solid rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.4)", backgroundColor: "white" }}
        >
          ⋯
        </button>
      </div>
      {open && (
        <FontPickerModal
          value={value}
          onChange={(family) => { loadGoogleFont(family); onChange(family); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function TabBar({ tabs, active, onChange }: {
  tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void;
}) {
  return (
    <div className="flex mb-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className="relative px-5 py-2 text-xs font-mono uppercase tracking-widest transition-colors"
          style={{ color: active === t.key ? "#0C0C0A" : "rgba(0,0,0,0.3)" }}
        >
          {t.label}
          {active === t.key && <span className="absolute bottom-0 left-0 right-0 h-px bg-black" />}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-12">
      <div className="flex items-baseline gap-4 mb-4">
        <span className="font-mono text-xs tabular-nums" style={{ color: "rgba(0,0,0,0.2)" }}>{number}</span>
        <h2 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, system-ui" }}>{title}</h2>
      </div>
      <div className="h-px w-full" style={{ backgroundColor: "rgba(0,0,0,0.07)" }} />
    </div>
  );
}

function ContrastBadge({ ratio }: { ratio: number }) {
  const r = Math.round(ratio * 10) / 10;
  const bg = ratio >= 4.5 ? "#16A34A" : ratio >= 3 ? "#D97706" : "#DC2626";
  return (
    <span className="font-mono text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: bg }}>
      {r}:1
    </span>
  );
}

/* ── Typography Section ────────────────────────────────────────────────────── */

const H_NAMES = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9"];
const B_NAMES = ["xl", "lg", "base", "sm", "xs"];
const M_NAMES = ["lg", "base", "sm", "xs"];

const INIT_TEXTS = {
  headings: [
    "The Architecture of Type",
    "Form Follows Function",
    "Swiss Design Principles",
    "Grid and Proportion",
    "Negative Space",
    "Typographic Hierarchy",
    "Details Matter",
    "Craft",
    "Form",
  ],
  body: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. Every good boy does fine.",
    "A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart.",
    "Typography is the craft of endowing human language with a durable visual form, and thus with an independent existence.",
    "The choice of typeface is the most fundamental typographic act and the one most likely to determine the outcome of a design.",
    "Good typography makes the reading experience better.",
  ],
  mono: [
    "const scale = (base, ratio, step) => base * ratio ** step;",
    "--ds-color-brand-accent: #2D2DFF;",
    "font-size: clamp(1rem, 2vw, 1.5rem);",
    "// 16px → 1rem → t-base",
  ],
};

function TypographySection({ ds, update }: { ds: DS; update: (p: Partial<DS>) => void }) {
  const [tab, setTab] = useState("headings");
  const [texts, setTexts] = useState(INIT_TEXTS);

  const hScale = typeSteps(ds.headings.base, ds.headings.ratio, ds.headings.steps);
  const bScale = typeSteps(ds.body.base, ds.body.ratio, ds.body.steps);
  const mScale = typeSteps(ds.mono.base, ds.mono.ratio, ds.mono.steps);

  const setHeadText = (i: number, v: string) => {
    const next = [...texts.headings]; next[i] = v;
    setTexts((t) => ({ ...t, headings: next }));
  };
  const setBodyText = (i: number, v: string) => {
    const next = [...texts.body]; next[i] = v;
    setTexts((t) => ({ ...t, body: next }));
  };
  const setMonoText = (i: number, v: string) => {
    const next = [...texts.mono]; next[i] = v;
    setTexts((t) => ({ ...t, mono: next }));
  };

  const metaRow = (items: string[]) => (
    <div className="flex items-center gap-3">
      {items.map((v, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-xs" style={{ color: "rgba(0,0,0,0.2)" }}>·</span>}
          <span className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{v}</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <section id="typography" className="min-h-screen pl-24 pr-16 py-20">
      <SectionHeader number="01" title="Typography" />
      <TabBar
        tabs={[{ key: "headings", label: "Headings" }, { key: "body", label: "Body" }, { key: "mono", label: "Mono" }]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Headings ── */}
      {tab === "headings" && (
        <div>
          <div className="flex items-center justify-between mb-8">
            {metaRow([ds.headings.fontFamily, `×${ds.headings.ratio}`, `${ds.headings.steps} steps`, `lh ${ds.headings.lineHeight}`])}
            <CogPanel label="Heading Scale" align="right">
              <Field label="Font Family"><FontFamilyInput value={ds.headings.fontFamily} onChange={(v) => update({ headings: { ...ds.headings, fontFamily: v } })} /></Field>
              <Field label="Base Size (px)"><NInput value={ds.headings.base} onChange={(v) => update({ headings: { ...ds.headings, base: v } })} min={8} max={32} /></Field>
              <Field label="Scale Ratio"><NInput value={ds.headings.ratio} onChange={(v) => update({ headings: { ...ds.headings, ratio: v } })} min={1.05} max={2} step={0.001} /></Field>
              <Field label="Steps"><NInput value={ds.headings.steps} onChange={(v) => update({ headings: { ...ds.headings, steps: Math.round(v) } })} min={2} max={9} /></Field>
              <Field label="Line Height"><NInput value={ds.headings.lineHeight} onChange={(v) => update({ headings: { ...ds.headings, lineHeight: v } })} min={1} max={2} step={0.01} /></Field>
              <Field label="Weight"><NInput value={ds.headings.weight} onChange={(v) => update({ headings: { ...ds.headings, weight: v } })} min={100} max={900} step={100} /></Field>
            </CogPanel>
          </div>
          <div>
            {hScale.map((size, i) => (
              <div key={i} className="flex items-center gap-6 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-28 shrink-0 space-y-0.5">
                  <div className="font-mono text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>{H_NAMES[i] ?? `H${i + 1}`}</div>
                  <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>{(size / 16).toFixed(3)}rem</div>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <EditableText
                    value={texts.headings[i] ?? "Heading sample"}
                    onChange={(v) => setHeadText(i, v)}
                    style={{
                      fontFamily: `${ds.headings.fontFamily}, Georgia, serif`,
                      fontSize: `${(size / 16).toFixed(4)}rem`,
                      lineHeight: ds.headings.lineHeight,
                      fontWeight: ds.headings.weight,
                      whiteSpace: "nowrap",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      {tab === "body" && (
        <div>
          <div className="flex items-center justify-between mb-8">
            {metaRow([ds.body.fontFamily, `×${ds.body.ratio}`, `lh ${ds.body.lineHeight}`])}
            <CogPanel label="Body Scale" align="right">
              <Field label="Font Family"><FontFamilyInput value={ds.body.fontFamily} onChange={(v) => update({ body: { ...ds.body, fontFamily: v } })} /></Field>
              <Field label="Base Size (px)"><NInput value={ds.body.base} onChange={(v) => update({ body: { ...ds.body, base: v } })} min={8} max={24} /></Field>
              <Field label="Scale Ratio"><NInput value={ds.body.ratio} onChange={(v) => update({ body: { ...ds.body, ratio: v } })} min={1.05} max={1.8} step={0.001} /></Field>
              <Field label="Steps"><NInput value={ds.body.steps} onChange={(v) => update({ body: { ...ds.body, steps: Math.round(v) } })} min={2} max={8} /></Field>
              <Field label="Line Height"><NInput value={ds.body.lineHeight} onChange={(v) => update({ body: { ...ds.body, lineHeight: v } })} min={1.2} max={2.5} step={0.05} /></Field>
              <Field label="Weight"><NInput value={ds.body.weight} onChange={(v) => update({ body: { ...ds.body, weight: v } })} min={100} max={900} step={100} /></Field>
            </CogPanel>
          </div>
          <div className="space-y-8">
            {bScale.map((size, i) => (
              <div key={i} className="flex items-center gap-8 pb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-28 shrink-0 space-y-0.5">
                  <div className="font-mono text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>{B_NAMES[i] ?? `step-${i}`}</div>
                  <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>{(size / 16).toFixed(3)}rem</div>
                </div>
                <div className="flex-1 max-w-2xl">
                  <EditableText
                    value={texts.body[i] ?? "Body text sample"}
                    onChange={(v) => setBodyText(i, v)}
                    style={{
                      fontFamily: `${ds.body.fontFamily}, system-ui, sans-serif`,
                      fontSize: `${(size / 16).toFixed(4)}rem`,
                      lineHeight: ds.body.lineHeight,
                      fontWeight: ds.body.weight,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mono ── */}
      {tab === "mono" && (
        <div>
          <div className="flex items-center justify-between mb-8">
            {metaRow([ds.mono.fontFamily, `×${ds.mono.ratio}`, `lh ${ds.mono.lineHeight}`])}
            <CogPanel label="Mono Scale" align="right">
              <Field label="Font Family"><FontFamilyInput value={ds.mono.fontFamily} onChange={(v) => update({ mono: { ...ds.mono, fontFamily: v } })} /></Field>
              <Field label="Base Size (px)"><NInput value={ds.mono.base} onChange={(v) => update({ mono: { ...ds.mono, base: v } })} min={8} max={20} /></Field>
              <Field label="Scale Ratio"><NInput value={ds.mono.ratio} onChange={(v) => update({ mono: { ...ds.mono, ratio: v } })} min={1.05} max={1.6} step={0.001} /></Field>
              <Field label="Steps"><NInput value={ds.mono.steps} onChange={(v) => update({ mono: { ...ds.mono, steps: Math.round(v) } })} min={2} max={8} /></Field>
              <Field label="Line Height"><NInput value={ds.mono.lineHeight} onChange={(v) => update({ mono: { ...ds.mono, lineHeight: v } })} min={1.2} max={2.5} step={0.05} /></Field>
            </CogPanel>
          </div>
          <div className="space-y-5">
            {mScale.map((size, i) => (
              <div key={i} className="flex items-center gap-6 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-28 shrink-0 space-y-0.5">
                  <div className="font-mono text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>{M_NAMES[i] ?? `step-${i}`}</div>
                  <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>{(size / 16).toFixed(3)}rem</div>
                </div>
                <div className="flex-1 rounded-md px-4 py-2.5" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
                  <EditableText
                    value={texts.mono[i] ?? "monospace text"}
                    onChange={(v) => setMonoText(i, v)}
                    style={{
                      fontFamily: `${ds.mono.fontFamily}, monospace`,
                      fontSize: `${(size / 16).toFixed(4)}rem`,
                      lineHeight: ds.mono.lineHeight,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Colors Section ────────────────────────────────────────────────────────── */

function ColorSwatch({ color, onChange, height = 128 }: {
  color: string; onChange: (v: string) => void; height?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className="relative cursor-pointer group rounded-lg overflow-hidden"
      style={{ backgroundColor: color, height }}
      onClick={() => ref.current?.click()}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
        <Settings size={14} style={{ color: isLight(color) ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)" }} />
      </div>
      <input ref={ref} type="color" value={color} onChange={(e) => onChange(e.target.value)} className="sr-only" />
    </div>
  );
}

/* palette sub-group */
function PaletteGroup({ label, items }: {
  label: string;
  items: { name: string; token: string; color: string; onChange: (v: string) => void }[];
}) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(0,0,0,0.35)" }}>{label}</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <div key={item.name}>
            <ColorSwatch color={item.color} onChange={item.onChange} />
            <div className="mt-2 space-y-0.5">
              <div className="text-xs font-medium">{item.name}</div>
              <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{item.token}</div>
              <div className="font-mono text-xs uppercase" style={{ color: "rgba(0,0,0,0.3)" }}>{item.color}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* usage accordion panel */
type SurfaceKey = "base" | "alt" | "dark" | "card";

function UsagePanel({ surfaceKey, ds }: { surfaceKey: SurfaceKey; ds: DS }) {
  const bg = ds.surface[surfaceKey];
  const isDark = surfaceKey === "dark";
  const isCard = surfaceKey === "card";
  const bodyFont = `${ds.body.fontFamily}, system-ui`;
  const headFont = `${ds.headings.fontFamily}, Georgia, serif`;

  const hScale = typeSteps(ds.headings.base, ds.headings.ratio, ds.headings.steps);
  const h3Size = hScale[2] ?? 50;

  const mdR = 8;
  const btnFg = (bg: string) => (isLight(bg) ? ds.textCol.body : "#fff");

  const textRows: { label: string; color: string }[] = isDark
    ? [
        { label: "text.ondark", color: ds.textCol.ondark },
        { label: "text.accent", color: ds.textCol.accent },
        { label: "text.muted", color: ds.textCol.muted },
      ]
    : [
        { label: "text.body", color: ds.textCol.body },
        { label: "text.accent", color: ds.textCol.accent },
        { label: "text.muted", color: ds.textCol.muted },
      ];

  return (
    <div
      className="w-full rounded-xl p-10 flex flex-col gap-8"
      style={{ backgroundColor: bg, minHeight: 360 }}
    >
      {!isCard && (
        <>
          {/* Heading H3 */}
          <div>
            <div style={{
              fontFamily: headFont,
              fontSize: h3Size,
              lineHeight: ds.headings.lineHeight,
              fontWeight: ds.headings.weight,
              color: isDark ? ds.textCol.ondark : ds.textCol.body,
            }}>
              The Architecture of Type
            </div>
          </div>

          {/* Text rows with contrast badges */}
          <div className="space-y-3">
            {textRows.map(({ label, color }) => (
              <div key={label} className="flex items-baseline justify-between gap-6">
                <p style={{
                  fontFamily: bodyFont,
                  fontSize: ds.body.base,
                  lineHeight: ds.body.lineHeight,
                  color,
                  flex: 1,
                }}>
                  {label} — The quick brown fox jumps over the lazy dog
                </p>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="font-mono text-xs" style={{ color: isLight(bg) ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)" }}>
                    {label.split(".")[1]}
                  </span>
                  <ContrastBadge ratio={cr(color, bg)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isCard && (
        <div className="flex flex-col gap-6">
          <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.3)" }}>
            Brand &amp; Action colors on surface.card
          </div>
          {/* Brand buttons */}
          <div>
            <div className="font-mono text-xs mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>Brand</div>
            <div className="flex flex-wrap gap-3">
              {(["accent", "primary", "secondary", "tertiary"] as const).map((k) => (
                <button
                  key={k}
                  className="px-5 py-2.5 font-medium text-sm hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: ds.brand[k],
                    color: btnFg(ds.brand[k]),
                    borderRadius: mdR,
                    fontFamily: bodyFont,
                  }}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Action buttons */}
          <div>
            <div className="font-mono text-xs mb-3" style={{ color: "rgba(0,0,0,0.3)" }}>Action</div>
            <div className="flex flex-wrap gap-3">
              {(["success", "warning", "info", "danger"] as const).map((k) => (
                <button
                  key={k}
                  className="px-5 py-2.5 font-medium text-sm hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: ds.action[k],
                    color: "#fff",
                    borderRadius: mdR,
                    fontFamily: bodyFont,
                  }}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SURFACE_KEYS: SurfaceKey[] = ["base", "alt", "dark", "card"];

function ColorsSection({ ds, update }: { ds: DS; update: (p: Partial<DS>) => void }) {
  const [tab, setTab] = useState("palette");
  const [activeSurface, setActiveSurface] = useState<SurfaceKey>("base");

  return (
    <section id="colors" className="min-h-screen pl-24 pr-16 py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <SectionHeader number="02" title="Color" />
      <TabBar
        tabs={[{ key: "palette", label: "Palette" }, { key: "usage", label: "Usage" }]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Palette tab ── */}
      {tab === "palette" && (
        <div className="space-y-14">
          <PaletteGroup
            label="Brand"
            items={(["accent", "primary", "secondary", "tertiary"] as const).map((k) => ({
              name: k, token: `--color-brand-${k}`, color: ds.brand[k],
              onChange: (v) => update({ brand: { ...ds.brand, [k]: v } }),
            }))}
          />
          <PaletteGroup
            label="Action"
            items={(["success", "warning", "info", "danger"] as const).map((k) => ({
              name: k, token: `--color-action-${k}`, color: ds.action[k],
              onChange: (v) => update({ action: { ...ds.action, [k]: v } }),
            }))}
          />
          <PaletteGroup
            label="Text"
            items={(["body", "accent", "muted", "ondark"] as const).map((k) => ({
              name: k, token: `--color-text-${k}`, color: ds.textCol[k],
              onChange: (v) => update({ textCol: { ...ds.textCol, [k]: v } }),
            }))}
          />
          <PaletteGroup
            label="Surface"
            items={(["base", "alt", "dark", "card"] as const).map((k) => ({
              name: k, token: `--color-surface-${k}`, color: ds.surface[k],
              onChange: (v) => update({ surface: { ...ds.surface, [k]: v } }),
            }))}
          />
        </div>
      )}

      {/* ── Usage tab ── */}
      {tab === "usage" && (
        <div>
          {/* Horizontal accordion surface switcher */}
          <div
            className="flex overflow-hidden rounded-xl mb-0"
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              minHeight: 56,
            }}
          >
            {SURFACE_KEYS.map((sk) => {
              const bg = ds.surface[sk];
              const active = activeSurface === sk;
              const labelColor = isLight(bg) ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)";
              const tokenColor = isLight(bg) ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)";
              return (
                <button
                  key={sk}
                  onClick={() => setActiveSurface(sk)}
                  className="relative flex flex-col items-start justify-end p-4 transition-all duration-300 overflow-hidden text-left"
                  style={{
                    backgroundColor: bg,
                    flex: active ? "5 0 0%" : "1 0 0%",
                    borderRight: sk !== "card" ? "1px solid rgba(0,0,0,0.08)" : "none",
                    minWidth: 0,
                  }}
                >
                  {/* Active indicator strip */}
                  {active && (
                    <span
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: isLight(bg) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)" }}
                    />
                  )}

                  <div className="truncate w-full">
                    <div
                      className="font-mono font-medium truncate"
                      style={{
                        fontSize: active ? 12 : 10,
                        color: labelColor,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {active ? `surface.${sk}` : sk}
                    </div>
                    {active && (
                      <div className="font-mono text-xs uppercase mt-0.5" style={{ color: tokenColor }}>
                        {bg}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <UsagePanel surfaceKey={activeSurface} ds={ds} />
        </div>
      )}
    </section>
  );
}

/* ── Spacing Section ───────────────────────────────────────────────────────── */

const SP_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];

function SpacingSection({ ds, update }: { ds: DS; update: (p: Partial<DS>) => void }) {
  const scale = spacingSteps(ds.spacing.base, ds.spacing.type, ds.spacing.ratio, ds.spacing.steps);
  const max = Math.max(...scale, 1);

  return (
    <section id="spacing" className="min-h-screen pl-24 pr-16 py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <SectionHeader number="03" title="Spacing" />

      <div className="flex items-center gap-5 mb-12">
        <CogPanel label="Spacing Scale">
          <Field label="Base (px)"><NInput value={ds.spacing.base} onChange={(v) => update({ spacing: { ...ds.spacing, base: v } })} min={1} max={16} /></Field>
          <Field label="Type">
            <select
              value={ds.spacing.type}
              onChange={(e) => update({ spacing: { ...ds.spacing, type: e.target.value as "geo" | "arith" } })}
              className="w-full px-2 py-1 text-xs font-mono bg-white rounded focus:outline-none"
              style={{ border: "1px solid rgba(0,0,0,0.12)" }}
            >
              <option value="geo">Geometric (base × ratioⁿ)</option>
              <option value="arith">Arithmetic (base + step×n)</option>
            </select>
          </Field>
          <Field label={ds.spacing.type === "geo" ? "Ratio" : "Increment (px)"}>
            <NInput
              value={ds.spacing.ratio}
              onChange={(v) => update({ spacing: { ...ds.spacing, ratio: v } })}
              min={ds.spacing.type === "geo" ? 1.1 : 1}
              max={ds.spacing.type === "geo" ? 4 : 64}
              step={ds.spacing.type === "geo" ? 0.05 : 1}
            />
          </Field>
          <Field label="Steps"><NInput value={ds.spacing.steps} onChange={(v) => update({ spacing: { ...ds.spacing, steps: Math.round(v) } })} min={3} max={14} /></Field>
        </CogPanel>
        <span className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>
          {ds.spacing.type === "geo"
            ? `${(ds.spacing.base / 16).toFixed(4)}rem × ${ds.spacing.ratio}ⁿ`
            : `${(ds.spacing.base / 16).toFixed(4)}rem + ${(ds.spacing.ratio / 16).toFixed(4)}rem × n`}
        </span>
      </div>

      <div className="space-y-3 mb-16">
        {scale.map((val, i) => (
          <div key={i} className="flex items-center gap-5">
            <div className="w-8 text-right font-mono text-xs shrink-0" style={{ color: "rgba(0,0,0,0.25)" }}>{SP_NAMES[i] ?? i + 1}</div>
            <div className="w-24 font-mono text-xs shrink-0" style={{ color: "rgba(0,0,0,0.45)" }}>{(val / 16).toFixed(3)}rem</div>
            <div className="flex-1 min-w-0">
              <div
                className="h-5 rounded-sm transition-all duration-300"
                style={{
                  width: `${Math.max(1, (val / max) * 100)}%`,
                  backgroundColor: ds.brand.accent,
                  opacity: 0.4 + (i / scale.length) * 0.6,
                }}
              />
            </div>
            <div className="w-24 font-mono text-xs text-right shrink-0" style={{ color: "rgba(0,0,0,0.2)" }}>--space-{SP_NAMES[i] ?? i + 1}</div>
          </div>
        ))}
      </div>

      {/* Visual preview */}
      <div>
        <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>Visual Preview</div>
        <div className="flex items-end gap-1.5 p-6 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
          {scale.slice(0, 10).map((val, i) => (
            <div
              key={i}
              title={`${SP_NAMES[i]}: ${(val / 16).toFixed(3)}rem`}
              className="shrink-0 rounded-sm transition-all"
              style={{
                width: Math.min(val, 160),
                height: Math.min(val, 160),
                backgroundColor: ds.brand.accent,
                opacity: 0.25 + (i / 10) * 0.75,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Shapes Section ────────────────────────────────────────────────────────── */

function ShapesSection({ ds, update }: { ds: DS; update: (p: Partial<DS>) => void }) {
  return (
    <section id="shapes" className="min-h-screen pl-24 pr-16 py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <SectionHeader number="04" title="Shape" />

      {/* Border Radius */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>Border Radius</div>
          <CogPanel label="Radius Steps">
            {ds.radii.map((r, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className="w-12 font-mono text-xs shrink-0" style={{ color: "rgba(0,0,0,0.4)" }}>{r.name}</span>
                <NInput
                  value={r.value}
                  onChange={(v) => {
                    const next = [...ds.radii]; next[i] = { ...r, value: v };
                    update({ radii: next });
                  }}
                  min={0} max={9999}
                />
                <span className="font-mono text-xs shrink-0" style={{ color: "rgba(0,0,0,0.3)" }}>px</span>
              </div>
            ))}
          </CogPanel>
        </div>
        <div className="flex gap-8 flex-wrap items-end">
          {ds.radii.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-3">
              <div
                style={{
                  width: 72, height: 72,
                  border: "2px solid rgba(0,0,0,0.14)",
                  backgroundColor: "white",
                  borderRadius: r.value >= 9999 ? "50%" : `${r.value}px`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                }}
              />
              <div className="text-center">
                <div className="font-mono text-xs font-medium">{r.name}</div>
                <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>
                  {r.value >= 9999 ? "∞" : `${(r.value / 16).toFixed(3)}rem`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elevation */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>Elevation</div>
          <CogPanel label="Elevation Levels">
            {ds.elevations.map((e, i) => (
              <div key={i} className="mb-4 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="font-mono text-xs font-medium mb-2" style={{ color: "rgba(0,0,0,0.45)" }}>Level {e.name}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["blur", "spread", "y", "opacity"] as const).map((prop) => (
                    <div key={prop}>
                      <div className="font-mono mb-0.5" style={{ fontSize: 10, color: "rgba(0,0,0,0.3)" }}>{prop}</div>
                      <NInput
                        value={e[prop]}
                        onChange={(v) => {
                          const next = [...ds.elevations]; next[i] = { ...e, [prop]: v };
                          update({ elevations: next });
                        }}
                        min={prop === "opacity" ? 0 : prop === "spread" ? -100 : 0}
                        max={prop === "opacity" ? 1 : 200}
                        step={prop === "opacity" ? 0.01 : 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CogPanel>
        </div>
        <div className="grid grid-cols-6 gap-10">
          {ds.elevations.map((e) => {
            const shadow = e.opacity > 0
              ? `0 ${e.y}px ${e.blur}px ${e.spread}px rgba(0,0,0,${e.opacity})`
              : "none";
            return (
              <div key={e.name} className="flex flex-col items-center gap-4">
                <div
                  style={{ width: 88, height: 88, backgroundColor: "white", borderRadius: 10, boxShadow: shadow }}
                />
                <div className="text-center">
                  <div className="font-mono text-xs font-medium">shadow-{e.name}</div>
                  <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>{e.blur}/{Math.abs(e.spread)}px</div>
                  <div className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.2)" }}>α {e.opacity}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Components Section ────────────────────────────────────────────────────── */

function ComponentsSection({ ds }: { ds: DS }) {
  const [tab, setTab] = useState("buttons");

  const mdR = ds.radii.find((r) => r.name === "md")?.value ?? 8;
  const lgR = ds.radii.find((r) => r.name === "lg")?.value ?? 12;
  const elev2 = ds.elevations[2];
  const shadow = elev2 && elev2.opacity > 0
    ? `0 ${elev2.y}px ${elev2.blur}px ${elev2.spread}px rgba(0,0,0,${elev2.opacity})`
    : "0 2px 8px rgba(0,0,0,0.08)";

  const primaryColor = ds.brand.primary;
  const primaryFg = isLight(primaryColor) ? ds.textCol.body : "#ffffff";
  const accentColor = ds.brand.accent;
  const accentFg = isLight(accentColor) ? ds.textCol.body : "#ffffff";

  const btn = (bg: string, fg: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    backgroundColor: bg, color: fg,
    borderRadius: mdR,
    fontFamily: `${ds.body.fontFamily}, system-ui`,
    fontSize: ds.body.base,
    cursor: "pointer",
    ...extra,
  });

  return (
    <section id="components" className="min-h-screen pl-24 pr-16 py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <SectionHeader number="05" title="Components" />
      <TabBar
        tabs={[{ key: "buttons", label: "Buttons" }, { key: "containers", label: "Containers" }, { key: "cards", label: "Cards" }]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Buttons ── */}
      {tab === "buttons" && (
        <div className="space-y-14">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>Variants</div>
            <div className="flex flex-wrap gap-4 items-center">
              <button className="px-5 py-2.5 font-medium hover:opacity-90 transition-opacity" style={btn(primaryColor, primaryFg)}>Primary</button>
              <button className="px-5 py-2.5 font-medium hover:opacity-90 transition-opacity" style={btn(accentColor, accentFg)}>Accent</button>
              <button
                className="px-5 py-2.5 font-medium hover:bg-black/5 transition-colors"
                style={btn("transparent", ds.textCol.body, { border: "1.5px solid rgba(0,0,0,0.18)" })}
              >Secondary</button>
              <button
                className="px-5 py-2.5 font-medium hover:bg-black/5 transition-colors"
                style={btn("transparent", ds.textCol.muted)}
              >Ghost</button>
              <button className="px-5 py-2.5 font-medium hover:opacity-90 transition-opacity" style={btn(ds.action.success, "#fff")}>Success</button>
              <button className="px-5 py-2.5 font-medium hover:opacity-90 transition-opacity" style={btn(ds.action.warning, "#fff")}>Warning</button>
              <button className="px-5 py-2.5 font-medium hover:opacity-90 transition-opacity" style={btn(ds.action.danger, "#fff")}>Danger</button>
              <button className="px-5 py-2.5 font-medium hover:opacity-90 transition-opacity" style={btn(ds.action.info, "#fff")}>Info</button>
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>Sizes</div>
            <div className="flex flex-wrap gap-6 items-end">
              {[
                { label: "XS", px: 10, py: 4, fs: 11 },
                { label: "SM", px: 14, py: 6, fs: 12 },
                { label: "MD", px: 20, py: 10, fs: 14 },
                { label: "LG", px: 24, py: 12, fs: 16 },
                { label: "XL", px: 32, py: 16, fs: 18 },
              ].map(({ label, px, py, fs }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <button
                    className="font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor, color: primaryFg, borderRadius: mdR, fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: fs, padding: `${py}px ${px}px` }}
                  >{label}</button>
                  <span className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.25)" }}>{px}/{py}px</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>States</div>
            <div className="flex flex-wrap gap-4 items-center">
              <button className="px-5 py-2.5 font-medium" style={btn(primaryColor, primaryFg)}>Default</button>
              <button className="px-5 py-2.5 font-medium" style={btn(primaryColor, primaryFg, { outline: `2px solid ${accentColor}`, outlineOffset: "2px" })}>Focused</button>
              <button disabled className="px-5 py-2.5 font-medium cursor-not-allowed" style={{ ...btn(primaryColor, primaryFg), opacity: 0.38 }}>Disabled</button>
              <button className="px-5 py-2.5 font-medium flex items-center gap-2" style={btn(primaryColor, primaryFg)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
                  <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Loading
              </button>
              <button className="px-5 py-2.5 font-medium flex items-center gap-1.5" style={btn(primaryColor, primaryFg)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <polyline points="2,7 5.5,10.5 12,4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Containers ── */}
      {tab === "containers" && (
        <div className="space-y-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>Text Container</div>
            <div className="max-w-2xl p-8" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: lgR }}>
              <h2 style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 28, lineHeight: ds.headings.lineHeight, color: ds.textCol.body, marginBottom: 12 }}>
                Container heading
              </h2>
              <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base, lineHeight: ds.body.lineHeight, color: ds.textCol.body, marginBottom: 16 }}>
                A text container establishes the reading column width, internal padding, and typographic rhythm.
                Good containers make content feel intentional and effortless to read.
              </p>
              <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.85, lineHeight: ds.body.lineHeight, color: ds.textCol.muted }}>
                Design Systems · August 2026 · 4 min read
              </p>
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>Text + Image</div>
            <div className="grid grid-cols-2 overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: lgR }}>
              <div className="p-8 flex flex-col justify-center">
                <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: accentColor }}>Feature</p>
                <h2 style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 24, lineHeight: ds.headings.lineHeight, color: ds.textCol.body, marginBottom: 10 }}>
                  Visual rhythm through proportion
                </h2>
                <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base, lineHeight: ds.body.lineHeight, color: ds.textCol.muted, marginBottom: 20 }}>
                  Every element relates to every other through spatial ratios.
                </p>
                <button
                  className="self-start px-5 py-2 font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accentColor, color: accentFg, borderRadius: mdR, fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base }}
                >
                  Learn more
                </button>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${ds.brand.secondary}50, ${accentColor}60)`, minHeight: 240 }} />
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "rgba(0,0,0,0.3)" }}>Full-bleed</div>
            <div className="overflow-hidden" style={{ borderRadius: lgR, background: `linear-gradient(135deg, ${ds.brand.primary} 0%, ${ds.brand.secondary} 100%)`, padding: "64px 48px" }}>
              <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: isLight(ds.brand.primary) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)" }}>Design System</p>
              <h2 style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 40, lineHeight: ds.headings.lineHeight, color: isLight(ds.brand.primary) ? ds.textCol.body : "#fff", marginBottom: 16 }}>
                Everything in its right place
              </h2>
              <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base, lineHeight: ds.body.lineHeight, color: isLight(ds.brand.primary) ? ds.textCol.muted : "rgba(255,255,255,0.65)", maxWidth: 480 }}>
                A systematic approach to visual design ensures that every decision is intentional, every token purposeful.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Cards ── */}
      {tab === "cards" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Article card */}
          <div className="bg-white p-6" style={{ borderRadius: lgR, boxShadow: shadow }}>
            <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: accentColor }}>Article</p>
            <h3 style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 22, lineHeight: ds.headings.lineHeight, color: ds.textCol.body, marginBottom: 8 }}>
              The grid as underlying structure
            </h3>
            <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.9, lineHeight: ds.body.lineHeight, color: ds.textCol.muted, marginBottom: 20 }}>
              Invisible scaffolding that organizes every element on the page into a coherent whole.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
              <span style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.8, color: ds.textCol.muted }}>Aug 2026 · 4 min</span>
            </div>
          </div>

          {/* Image card */}
          <div className="bg-white overflow-hidden" style={{ borderRadius: lgR, boxShadow: shadow }}>
            <div style={{ height: 160, background: `linear-gradient(135deg, ${ds.brand.primary}, ${ds.brand.secondary})` }} />
            <div className="p-5">
              <h3 style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 18, lineHeight: ds.headings.lineHeight, color: ds.textCol.body, marginBottom: 6 }}>Systematic color</h3>
              <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.85, lineHeight: ds.body.lineHeight, color: ds.textCol.muted, marginBottom: 14 }}>
                A palette that communicates hierarchy at every level.
              </p>
              <button className="text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor, color: primaryFg, borderRadius: mdR / 1.5, fontFamily: `${ds.body.fontFamily}, system-ui` }}>
                Read more
              </button>
            </div>
          </div>

          {/* Stat card */}
          <div className="p-6 flex flex-col justify-between" style={{ borderRadius: lgR, backgroundColor: primaryColor, boxShadow: shadow, minHeight: 220 }}>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: isLight(primaryColor) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)" }}>
                Design Tokens
              </p>
              <div style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 52, lineHeight: 1, color: isLight(primaryColor) ? ds.textCol.body : "#fff", marginBottom: 4 }}>128</div>
              <p style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.9, color: isLight(primaryColor) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)" }}>variables defined</p>
            </div>
            <div className="mt-6" style={{ height: 3, borderRadius: 9999, backgroundColor: isLight(primaryColor) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)" }}>
              <div style={{ height: "100%", width: "72%", borderRadius: 9999, backgroundColor: accentColor }} />
            </div>
          </div>

          {/* Feature card */}
          <div className="p-6 col-span-2" style={{ borderRadius: lgR, backgroundColor: ds.surface.alt, border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Spacing tokens", value: "8", desc: "steps in scale" },
                { label: "Color tokens", value: "16", desc: "across 4 groups" },
                { label: "Type steps", value: "16", desc: "heading + body + mono" },
              ].map(({ label, value, desc }) => (
                <div key={label}>
                  <div style={{ fontFamily: `${ds.headings.fontFamily}, Georgia, serif`, fontSize: 36, lineHeight: 1, color: ds.textCol.body, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.9, color: ds.textCol.body, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.8, color: ds.textCol.muted }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification card */}
          <div className="p-5" style={{ borderRadius: lgR, backgroundColor: "white", border: `1.5px solid ${accentColor}20`, boxShadow: shadow }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
              </div>
              <div>
                <div style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base, fontWeight: 600, color: ds.textCol.body, marginBottom: 4 }}>
                  Token file loaded
                </div>
                <div style={{ fontFamily: `${ds.body.fontFamily}, system-ui`, fontSize: ds.body.base * 0.875, lineHeight: ds.body.lineHeight, color: ds.textCol.muted }}>
                  26 design tokens applied successfully across all sections.
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-3 py-1 font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: accentColor, color: accentFg, borderRadius: mdR / 2, fontFamily: `${ds.body.fontFamily}, system-ui` }}>View</button>
                  <button className="text-xs px-3 py-1 hover:bg-black/5 transition-colors" style={{ color: ds.textCol.muted, borderRadius: mdR / 2, fontFamily: `${ds.body.fontFamily}, system-ui` }}>Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Token Guide Overlay ──────────────────────────────────────────────────── */

function TokenGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <div className="font-semibold text-sm" style={{ fontFamily: "Plus Jakarta Sans, system-ui" }}>CSS Variable Reference</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>Use these in your .css file to populate the visualizer</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-black/10 transition-colors" style={{ color: "rgba(0,0,0,0.4)" }}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "#0C0C0A" }}>
            <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="font-mono text-xs ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>design-tokens.css</span>
            </div>
            <div className="p-5 space-y-0.5">
              <div className="font-mono text-xs" style={{ color: "#5B4FE9" }}>:root {`{`}</div>
              {TOKEN_GUIDE.map(([name, val]) => (
                <div key={name} className="pl-4 flex gap-3 font-mono text-xs">
                  <span style={{ color: "#E94F7E" }}>{name}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>:</span>
                  <span style={{ color: "#7DD3B0" }}>{val}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>;</span>
                </div>
              ))}
              <div className="font-mono text-xs" style={{ color: "#5B4FE9" }}>{`}`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── App ───────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: "typography", label: "Type" },
  { id: "colors", label: "Color" },
  { id: "spacing", label: "Spacing" },
  { id: "shapes", label: "Shape" },
  { id: "components", label: "Components" },
] as const;

export default function App() {
  const [ds, setDS] = useState<DS>(() => {
    try {
      const raw = localStorage.getItem("ds-visualizer-v1");
      if (raw) {
        const saved = JSON.parse(raw) as DS;
        return {
          ...INIT,
          ...saved,
          headings: { ...INIT.headings, ...saved.headings },
          body:     { ...INIT.body,     ...saved.body },
          mono:     { ...INIT.mono,     ...saved.mono },
          brand:    { ...INIT.brand,    ...saved.brand },
          action:   { ...INIT.action,   ...saved.action },
          textCol:  { ...INIT.textCol,  ...saved.textCol },
          surface:  { ...INIT.surface,  ...saved.surface },
          spacing:  { ...INIT.spacing,  ...saved.spacing },
        };
      }
    } catch {}
    return INIT;
  });
  const [active, setActive] = useState<string>("typography");
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<DS>) => {
    setDS((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    try { localStorage.setItem("ds-visualizer-v1", JSON.stringify(ds)); } catch {}
  }, [ds]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActive(top.target.id);
        }
      },
      { threshold: 0.2 }
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const css = ev.target?.result as string;
      const vars = parseCSSVars(css);
      setLoadedFile(file.name);
      setDS((prev) => {
        const next = { ...prev };
        const h = { ...prev.headings };
        if (vars["--ds-heading-font"]) h.fontFamily = vars["--ds-heading-font"].replace(/["']/g, "");
        if (vars["--ds-heading-base"]) h.base = parseFloat(vars["--ds-heading-base"]);
        if (vars["--ds-heading-ratio"]) h.ratio = parseFloat(vars["--ds-heading-ratio"]);
        if (vars["--ds-heading-steps"]) h.steps = parseInt(vars["--ds-heading-steps"]);
        next.headings = h;
        const b = { ...prev.body };
        if (vars["--ds-body-font"]) b.fontFamily = vars["--ds-body-font"].replace(/["']/g, "");
        if (vars["--ds-body-base"]) b.base = parseFloat(vars["--ds-body-base"]);
        if (vars["--ds-body-ratio"]) b.ratio = parseFloat(vars["--ds-body-ratio"]);
        next.body = b;
        const m = { ...prev.mono };
        if (vars["--ds-mono-font"]) m.fontFamily = vars["--ds-mono-font"].replace(/["']/g, "");
        next.mono = m;
        const brand = { ...prev.brand };
        if (vars["--ds-color-brand-accent"]) brand.accent = vars["--ds-color-brand-accent"];
        if (vars["--ds-color-brand-primary"]) brand.primary = vars["--ds-color-brand-primary"];
        if (vars["--ds-color-brand-secondary"]) brand.secondary = vars["--ds-color-brand-secondary"];
        if (vars["--ds-color-brand-tertiary"]) brand.tertiary = vars["--ds-color-brand-tertiary"];
        next.brand = brand;
        const action = { ...prev.action };
        if (vars["--ds-color-action-success"]) action.success = vars["--ds-color-action-success"];
        if (vars["--ds-color-action-warning"]) action.warning = vars["--ds-color-action-warning"];
        if (vars["--ds-color-action-info"]) action.info = vars["--ds-color-action-info"];
        if (vars["--ds-color-action-danger"]) action.danger = vars["--ds-color-action-danger"];
        next.action = action;
        const tc = { ...prev.textCol };
        if (vars["--ds-color-text-body"]) tc.body = vars["--ds-color-text-body"];
        if (vars["--ds-color-text-accent"]) tc.accent = vars["--ds-color-text-accent"];
        if (vars["--ds-color-text-muted"]) tc.muted = vars["--ds-color-text-muted"];
        if (vars["--ds-color-text-ondark"]) tc.ondark = vars["--ds-color-text-ondark"];
        next.textCol = tc;
        const surf = { ...prev.surface };
        if (vars["--ds-color-surface-base"]) surf.base = vars["--ds-color-surface-base"];
        if (vars["--ds-color-surface-alt"]) surf.alt = vars["--ds-color-surface-alt"];
        if (vars["--ds-color-surface-dark"]) surf.dark = vars["--ds-color-surface-dark"];
        if (vars["--ds-color-surface-card"]) surf.card = vars["--ds-color-surface-card"];
        next.surface = surf;
        const sp = { ...prev.spacing };
        if (vars["--ds-spacing-base"]) sp.base = parseFloat(vars["--ds-spacing-base"]);
        if (vars["--ds-spacing-ratio"]) sp.ratio = parseFloat(vars["--ds-spacing-ratio"]);
        if (vars["--ds-spacing-steps"]) sp.steps = parseInt(vars["--ds-spacing-steps"]);
        next.spacing = sp;
        return next;
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const exportCSS = useCallback(() => {
    const SP_LABELS = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14"];
    const H_LABELS  = ["h1","h2","h3","h4","h5","h6","h7","h8","h9"];
    const B_LABELS  = ["xl","lg","base","sm","xs"];
    const M_LABELS  = ["lg","base","sm","xs"];
    const hScale = typeSteps(ds.headings.base, ds.headings.ratio, ds.headings.steps);
    const bScale = typeSteps(ds.body.base, ds.body.ratio, ds.body.steps);
    const mScale = typeSteps(ds.mono.base, ds.mono.ratio, ds.mono.steps);
    const spScale = spacingSteps(ds.spacing.base, ds.spacing.type, ds.spacing.ratio, ds.spacing.steps);

    const lines = [
      `/* Design System — exported ${new Date().toISOString().slice(0, 10)} */`,
      `:root {`,
      ``,
      `  /* ── Typography: Headings ─────────────────────────── */`,
      `  --ds-heading-font: "${ds.headings.fontFamily}";`,
      `  --ds-heading-base: ${(ds.headings.base / 16).toFixed(4)}rem;`,
      `  --ds-heading-ratio: ${ds.headings.ratio};`,
      `  --ds-heading-steps: ${ds.headings.steps};`,
      `  --ds-heading-line-height: ${ds.headings.lineHeight};`,
      `  --ds-heading-weight: ${ds.headings.weight};`,
      ...hScale.map((v, i) => `  --ds-type-${H_LABELS[i] ?? `h${i+1}`}: ${(v / 16).toFixed(4)}rem;`),
      ``,
      `  /* ── Typography: Body ─────────────────────────────── */`,
      `  --ds-body-font: "${ds.body.fontFamily}";`,
      `  --ds-body-base: ${(ds.body.base / 16).toFixed(4)}rem;`,
      `  --ds-body-ratio: ${ds.body.ratio};`,
      `  --ds-body-steps: ${ds.body.steps};`,
      `  --ds-body-line-height: ${ds.body.lineHeight};`,
      `  --ds-body-weight: ${ds.body.weight};`,
      ...bScale.map((v, i) => `  --ds-type-body-${B_LABELS[i] ?? `step-${i}`}: ${(v / 16).toFixed(4)}rem;`),
      ``,
      `  /* ── Typography: Mono ─────────────────────────────── */`,
      `  --ds-mono-font: "${ds.mono.fontFamily}";`,
      `  --ds-mono-base: ${(ds.mono.base / 16).toFixed(4)}rem;`,
      `  --ds-mono-ratio: ${ds.mono.ratio};`,
      `  --ds-mono-steps: ${ds.mono.steps};`,
      `  --ds-mono-line-height: ${ds.mono.lineHeight};`,
      ...mScale.map((v, i) => `  --ds-type-mono-${M_LABELS[i] ?? `step-${i}`}: ${(v / 16).toFixed(4)}rem;`),
      ``,
      `  /* ── Color: Brand ─────────────────────────────────── */`,
      `  --ds-color-brand-accent: ${ds.brand.accent};`,
      `  --ds-color-brand-primary: ${ds.brand.primary};`,
      `  --ds-color-brand-secondary: ${ds.brand.secondary};`,
      `  --ds-color-brand-tertiary: ${ds.brand.tertiary};`,
      ``,
      `  /* ── Color: Action ────────────────────────────────── */`,
      `  --ds-color-action-success: ${ds.action.success};`,
      `  --ds-color-action-warning: ${ds.action.warning};`,
      `  --ds-color-action-info: ${ds.action.info};`,
      `  --ds-color-action-danger: ${ds.action.danger};`,
      ``,
      `  /* ── Color: Text ──────────────────────────────────── */`,
      `  --ds-color-text-body: ${ds.textCol.body};`,
      `  --ds-color-text-accent: ${ds.textCol.accent};`,
      `  --ds-color-text-muted: ${ds.textCol.muted};`,
      `  --ds-color-text-ondark: ${ds.textCol.ondark};`,
      ``,
      `  /* ── Color: Surface ───────────────────────────────── */`,
      `  --ds-color-surface-base: ${ds.surface.base};`,
      `  --ds-color-surface-alt: ${ds.surface.alt};`,
      `  --ds-color-surface-dark: ${ds.surface.dark};`,
      `  --ds-color-surface-card: ${ds.surface.card};`,
      ``,
      `  /* ── Spacing ──────────────────────────────────────── */`,
      `  --ds-spacing-base: ${(ds.spacing.base / 16).toFixed(4)}rem;`,
      `  --ds-spacing-type: ${ds.spacing.type};`,
      `  --ds-spacing-ratio: ${ds.spacing.ratio};`,
      `  --ds-spacing-steps: ${ds.spacing.steps};`,
      ...spScale.map((v, i) => `  --ds-space-${SP_LABELS[i] ?? i+1}: ${(v / 16).toFixed(4)}rem;`),
      ``,
      `  /* ── Border Radius ────────────────────────────────── */`,
      ...ds.radii.map((r) => `  --ds-radius-${r.name}: ${r.value >= 9999 ? "9999px" : `${(r.value / 16).toFixed(4)}rem`};`),
      ``,
      `  /* ── Elevation ────────────────────────────────────── */`,
      ...ds.elevations.map((e) =>
        `  --ds-shadow-${e.name}: ${e.opacity > 0 ? `0 ${e.y}px ${e.blur}px ${e.spread}px rgba(0,0,0,${e.opacity})` : "none"};`
      ),
      `}`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-system.css";
    a.click();
    URL.revokeObjectURL(url);
  }, [ds]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F1ED", fontFamily: "Plus Jakarta Sans, system-ui" }}>
      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-10"
        style={{ backgroundColor: "rgba(242,241,237,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-5">
          <span className="font-mono text-xs font-semibold tracking-[0.18em]" style={{ color: "rgba(0,0,0,0.55)" }}>
            DS·VISUALIZER
          </span>
          {loadedFile && (
            <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {loadedFile}
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 font-mono text-xs transition-opacity hover:opacity-60"
            style={{ color: "rgba(0,0,0,0.35)" }}
          >
            <HelpCircle size={11} />
            Token guide
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 font-mono text-xs transition-opacity hover:opacity-60 cursor-pointer"
            style={{ color: "rgba(0,0,0,0.45)" }}
          >
            <Upload size={11} />
            Load CSS
          </button>
          <button
            onClick={exportCSS}
            className="flex items-center gap-1.5 font-mono text-xs transition-opacity hover:opacity-60 cursor-pointer"
            style={{ color: "rgba(0,0,0,0.45)" }}
          >
            <Download size={11} />
            Export CSS
          </button>
          <button
            onClick={() => { localStorage.removeItem("ds-visualizer-v1"); setDS(INIT); setLoadedFile(null); }}
            className="flex items-center gap-1.5 font-mono text-xs transition-opacity hover:opacity-60"
            style={{ color: "rgba(0,0,0,0.35)" }}
          >
            <RotateCcw size={11} />
            Reset
          </button>
          <input ref={fileRef} type="file" accept=".css" onChange={handleFile} className="sr-only" />
        </div>
      </header>

      {/* Side nav */}
      <nav className="fixed left-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            title={s.label}
            className="group flex items-center gap-3"
            onMouseEnter={(e) => {
              const d = Math.abs(
                SECTIONS.findIndex((x) => x.id === s.id) -
                SECTIONS.findIndex((x) => x.id === active)
              );
              e.currentTarget.style.transform = `scale(${[1.35, 1.18, 1.07, 1.0][Math.min(d, 3)]})`;
            }}
            onMouseLeave={(e) => {
              const d = Math.abs(
                SECTIONS.findIndex((x) => x.id === s.id) -
                SECTIONS.findIndex((x) => x.id === active)
              );
              e.currentTarget.style.transform = `scale(${[1.0, 0.82, 0.70, 0.62][Math.min(d, 3)]})`;
            }}
            style={{
              cursor: "pointer",
              transformOrigin: "left center",
              transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transform: (() => {
                const d = Math.abs(
                  SECTIONS.findIndex((x) => x.id === s.id) -
                  SECTIONS.findIndex((x) => x.id === active)
                );
                return `scale(${[1.0, 0.82, 0.70, 0.62][Math.min(d, 3)]})`;
              })(),
            }}
          >
            <div
              className="rounded-full shrink-0 transition-all duration-200"
              style={{
                width: active === s.id ? 9 : 6,
                height: active === s.id ? 9 : 6,
                backgroundColor: active === s.id ? "#0C0C0A" : "rgba(0,0,0,0.22)",
              }}
            />
            <span
              className={`font-mono text-xs transition-opacity duration-150 group-hover:opacity-100 ${active === s.id ? "opacity-80" : "opacity-0"}`}
              style={{ color: "rgba(0,0,0,0.55)", whiteSpace: "nowrap" }}
            >
              {s.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="pt-10">
        <TypographySection ds={ds} update={update} />
        <ColorsSection ds={ds} update={update} />
        <SpacingSection ds={ds} update={update} />
        <ShapesSection ds={ds} update={update} />
        <ComponentsSection ds={ds} />
      </main>

      {/* Footer */}
      <footer className="pl-24 pr-16 py-8 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <span className="font-mono text-xs" style={{ color: "rgba(0,0,0,0.25)" }}>DS·VISUALIZER — click any color to edit · click any text to edit · ⚙ to adjust scale</span>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-mono text-xs transition-opacity hover:opacity-60"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          ↑ top
        </button>
      </footer>

      {showGuide && <TokenGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
