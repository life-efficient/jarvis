import { useState, useEffect } from "react"

export type ThemeMode = "dark" | "light"

export interface AccentPreset {
  id: string
  label: string
  primary: string
  primaryFg: string
  primaryFgLight: string
  color: string
  gradientDark: string
  gradientLight: string
}

export interface FontPreset {
  id: string
  label: string
  family: string
  googleUrl?: string
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "violet",  label: "Violet",   primary: "248 88% 70%", primaryFg: "248 88% 10%", primaryFgLight: "248 88% 97%", color: "#7c6af7", gradientDark: "#1a1040", gradientLight: "#ede9fe" },
  { id: "indigo",  label: "Indigo",   primary: "239 84% 67%", primaryFg: "239 84% 10%", primaryFgLight: "239 84% 97%", color: "#6366f1", gradientDark: "#12124a", gradientLight: "#e0e7ff" },
  { id: "blue",    label: "Blue",     primary: "217 91% 65%", primaryFg: "217 91% 10%", primaryFgLight: "217 91% 97%", color: "#4f8ef7", gradientDark: "#0a1a3a", gradientLight: "#dbeafe" },
  { id: "cyan",    label: "Cyan",     primary: "189 85% 52%", primaryFg: "189 85% 10%", primaryFgLight: "189 85% 97%", color: "#22d3ee", gradientDark: "#051e28", gradientLight: "#cffafe" },
  { id: "teal",    label: "Teal",     primary: "173 80% 48%", primaryFg: "173 80% 10%", primaryFgLight: "173 80% 97%", color: "#14b8a6", gradientDark: "#051a18", gradientLight: "#ccfbf1" },
  { id: "emerald", label: "Emerald",  primary: "152 76% 52%", primaryFg: "152 76% 10%", primaryFgLight: "152 76% 97%", color: "#34d399", gradientDark: "#051a10", gradientLight: "#d1fae5" },
  { id: "rose",    label: "Rose",     primary: "350 89% 68%", primaryFg: "350 89% 10%", primaryFgLight: "350 89% 97%", color: "#f7637a", gradientDark: "#280610", gradientLight: "#ffe4e6" },
  { id: "pink",    label: "Pink",     primary: "330 81% 68%", primaryFg: "330 81% 10%", primaryFgLight: "330 81% 97%", color: "#f472b6", gradientDark: "#280618", gradientLight: "#fce7f3" },
  { id: "purple",  label: "Purple",   primary: "270 91% 70%", primaryFg: "270 91% 10%", primaryFgLight: "270 91% 97%", color: "#c084fc", gradientDark: "#1a0a38", gradientLight: "#f3e8ff" },
  { id: "amber",   label: "Amber",    primary: "38 95% 58%",  primaryFg: "38 95% 10%",  primaryFgLight: "38 95% 97%",  color: "#f5a623", gradientDark: "#281800", gradientLight: "#fef3c7" },
  { id: "orange",  label: "Orange",   primary: "25 95% 60%",  primaryFg: "25 95% 10%",  primaryFgLight: "25 95% 97%",  color: "#fb923c", gradientDark: "#281000", gradientLight: "#ffedd5" },
  { id: "slate",   label: "Slate",    primary: "215 25% 65%", primaryFg: "215 25% 10%", primaryFgLight: "215 25% 97%", color: "#94a3b8", gradientDark: "#0f1520", gradientLight: "#e2e8f0" },
]

export const FONT_PRESETS: FontPreset[] = [
  { id: "system",  label: "System",         family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif" },
  { id: "inter",   label: "Inter",          family: "'Inter', system-ui, sans-serif",       googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" },
  { id: "dmsans",  label: "DM Sans",        family: "'DM Sans', system-ui, sans-serif",     googleUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" },
  { id: "sora",    label: "Sora",           family: "'Sora', system-ui, sans-serif",        googleUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap" },
  { id: "space",   label: "Space Grotesk",  family: "'Space Grotesk', system-ui, sans-serif", googleUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap" },
  { id: "playfair",label: "Playfair",       family: "'Playfair Display', Georgia, ui-serif, serif", googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" },
  { id: "mono",    label: "Mono",           family: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace", googleUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" },
]

interface ThemeState {
  accentId: string
  fontId: string
  mode: ThemeMode
}

const STORAGE_KEY = "jarvis-theme-v1"
const DEFAULT: ThemeState = { accentId: "violet", fontId: "system", mode: "dark" }

function load(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT
}

const loadedFonts = new Set<string>()

function loadGoogleFont(url: string) {
  if (loadedFonts.has(url)) return
  loadedFonts.add(url)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = url
  document.head.appendChild(link)
}

function applyTheme(state: ThemeState) {
  const accent = ACCENT_PRESETS.find(a => a.id === state.accentId) ?? ACCENT_PRESETS[0]
  const font   = FONT_PRESETS.find(f => f.id === state.fontId)     ?? FONT_PRESETS[0]
  const isDark = state.mode === "dark"
  const root   = document.documentElement

  root.classList.toggle("dark", isDark)

  const primary   = isDark ? accent.primary   : accent.primary.replace(/(\d+)%$/, m => `${Math.max(0, parseInt(m) - 10)}%`)
  const primaryFg = isDark ? accent.primaryFg : accent.primaryFgLight

  root.style.setProperty("--primary",            primary)
  root.style.setProperty("--ring",               primary)
  root.style.setProperty("--accent-foreground",  primary)
  root.style.setProperty("--primary-foreground", primaryFg)

  if (font.googleUrl) loadGoogleFont(font.googleUrl)
  document.body.style.fontFamily = font.family
  document.body.style.background = isDark
    ? `radial-gradient(ellipse 120% 80% at 50% -10%, ${accent.gradientDark} 0%, #080810 55%)`
    : `radial-gradient(ellipse 120% 80% at 50% -10%, ${accent.gradientLight} 0%, #f8f8fc 55%)`
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeState>(load)

  useEffect(() => { applyTheme(theme) }, [theme])

  function save(next: ThemeState) {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return {
    theme,
    setAccent: (accentId: string) => save({ ...theme, accentId }),
    setFont:   (fontId: string)   => save({ ...theme, fontId }),
    setMode:   (mode: ThemeMode)  => save({ ...theme, mode }),
  }
}
