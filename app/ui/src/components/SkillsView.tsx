import { useState, useEffect } from "react"
import {
  X, Search, Globe, GitCommit, Rocket, Code2, FileText, Terminal,
  Layers, Palette, Shield, Zap, Activity, CheckSquare, MessageSquare,
  Bug, RotateCcw, BookMarked, ArrowUpCircle, TestTube, Wrench, Clock,
  type LucideIcon,
} from "lucide-react"
import {
  siGithub, siGitlab, siNotion, siFigma, siGoogle, siGmail,
  siDiscord, siJira, siWhatsapp, siTelegram, siLinear, siTrello,
  siAsana, siStripe, siShopify, siAirtable, siHubspot, siZapier,
  siX, siInstagram, siYoutube, siSpotify, siDropbox,
  siZoom, siConfluence, siBitbucket, siGitkraken,
  si1password, siImessage, siApple, siMarkdown,
} from "simple-icons"
import { cn } from "@/lib/utils"
import type { SendRPC } from "@/hooks/useGatewayWS"

interface BrandDef {
  path: string
  color: string
}

const BRAND_PATTERNS: Array<{ pattern: RegExp; brand: BrandDef }> = [
  { pattern: /github|\bgh\b/,      brand: { path: siGithub.path,        color: `#${siGithub.hex}` } },
  { pattern: /1password|1pass/,   brand: { path: si1password.path,     color: `#${si1password.hex}` } },
  { pattern: /imessage|imsg|bluebubble/, brand: { path: siImessage.path, color: `#${siImessage.hex}` } },
  { pattern: /apple reminders|apple calendar/, brand: { path: siApple.path, color: `#${siApple.hex}` } },
  { pattern: /markdown.*pdf|pdf.*markdown|markdowntopdf/, brand: { path: siMarkdown.path, color: `#${siMarkdown.hex}` } },
  { pattern: /gitlab/,            brand: { path: siGitlab.path,        color: `#${siGitlab.hex}` } },
  { pattern: /bitbucket/,         brand: { path: siBitbucket.path,     color: `#${siBitbucket.hex}` } },
  { pattern: /gitkraken/,         brand: { path: siGitkraken.path,     color: `#${siGitkraken.hex}` } },
  { pattern: /notion/,            brand: { path: siNotion.path,        color: `#${siNotion.hex}` } },
  { pattern: /figma/,             brand: { path: siFigma.path,         color: `#${siFigma.hex}` } },
  { pattern: /gmail/,             brand: { path: siGmail.path,         color: `#${siGmail.hex}` } },
  { pattern: /google/,            brand: { path: siGoogle.path,        color: `#${siGoogle.hex}` } },
  { pattern: /discord/,           brand: { path: siDiscord.path,       color: `#${siDiscord.hex}` } },
  { pattern: /jira/,              brand: { path: siJira.path,          color: `#${siJira.hex}` } },
  { pattern: /confluence/,        brand: { path: siConfluence.path,    color: `#${siConfluence.hex}` } },
  { pattern: /whatsapp/,          brand: { path: siWhatsapp.path,      color: `#${siWhatsapp.hex}` } },
  { pattern: /telegram/,          brand: { path: siTelegram.path,      color: `#${siTelegram.hex}` } },
  { pattern: /linear/,            brand: { path: siLinear.path,        color: `#${siLinear.hex}` } },
  { pattern: /trello/,            brand: { path: siTrello.path,        color: `#${siTrello.hex}` } },
  { pattern: /asana/,             brand: { path: siAsana.path,         color: `#${siAsana.hex}` } },
  { pattern: /airtable/,          brand: { path: siAirtable.path,      color: `#${siAirtable.hex}` } },
  { pattern: /hubspot/,           brand: { path: siHubspot.path,       color: `#${siHubspot.hex}` } },
  { pattern: /stripe/,            brand: { path: siStripe.path,        color: `#${siStripe.hex}` } },
  { pattern: /shopify/,           brand: { path: siShopify.path,       color: `#${siShopify.hex}` } },
  { pattern: /zapier/,            brand: { path: siZapier.path,        color: `#${siZapier.hex}` } },
  { pattern: /\btwitter\b|\bx\b/, brand: { path: siX.path,            color: `#${siX.hex}` } },
  { pattern: /instagram/,         brand: { path: siInstagram.path,     color: `#${siInstagram.hex}` } },
  { pattern: /youtube/,           brand: { path: siYoutube.path,       color: `#${siYoutube.hex}` } },
  { pattern: /spotify/,           brand: { path: siSpotify.path,       color: `#${siSpotify.hex}` } },
  { pattern: /dropbox/,           brand: { path: siDropbox.path,       color: `#${siDropbox.hex}` } },
  { pattern: /zoom/,              brand: { path: siZoom.path,          color: `#${siZoom.hex}` } },
]

function getBrand(name: string, key: string): BrandDef | null {
  const n = (name + " " + key).toLowerCase()
  return BRAND_PATTERNS.find(({ pattern }) => pattern.test(n))?.brand ?? null
}

interface SkillEntry {
  name: string
  description: string
  skillKey: string
  disabled: boolean
  eligible: boolean
  always: boolean
  bundled: boolean
  baseDir: string
  homepage?: string
}

type Filter = "all" | "ready" | "needs-setup" | "disabled"

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "ready",       label: "Ready" },
  { id: "needs-setup", label: "Needs Setup" },
  { id: "disabled",    label: "Disabled" },
]

const GRADIENTS: [string, string][] = [
  ["#6366f1", "#8b5cf6"],
  ["#3b82f6", "#06b6d4"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#d97706"],
  ["#ef4444", "#dc2626"],
  ["#ec4899", "#db2777"],
  ["#8b5cf6", "#7c3aed"],
  ["#06b6d4", "#0891b2"],
  ["#84cc16", "#65a30d"],
  ["#f97316", "#ea580c"],
]

function getGradient(key: string): [string, string] {
  const hash = key.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

function getSkillIcon(name: string, key: string): LucideIcon {
  const n = (name + " " + key).toLowerCase()
  if (/commit|git/.test(n))             return GitCommit
  if (/brows|fetch|http|web/.test(n))   return Globe
  if (/ship|deploy|land/.test(n))       return Rocket
  if (/qa|test|spec|flask/.test(n))     return TestTube
  if (/review|inspect/.test(n))         return Code2
  if (/investigat|debug|bug/.test(n))   return Bug
  if (/design|visual|ui/.test(n))       return Palette
  if (/plan|architect|layout/.test(n))  return Layers
  if (/doc|file|write|read/.test(n))    return FileText
  if (/search|find/.test(n))            return Search
  if (/message|slack|chat/.test(n))     return MessageSquare
  if (/terminal|bash|shell/.test(n))    return Terminal
  if (/task|todo|check/.test(n))        return CheckSquare
  if (/health|monitor|metric/.test(n))  return Activity
  if (/security|cso|guard/.test(n))     return Shield
  if (/retro|history/.test(n))          return RotateCcw
  if (/context|save|restore/.test(n))   return BookMarked
  if (/upgrade|update|version/.test(n)) return ArrowUpCircle
  if (/setup|config|install/.test(n))   return Wrench
  if (/cron|schedule|remind/.test(n))   return Clock
  return Zap
}

function skillFilter(skill: SkillEntry, filter: Filter): boolean {
  switch (filter) {
    case "ready":       return !skill.disabled && skill.eligible
    case "needs-setup": return !skill.disabled && !skill.eligible
    case "disabled":    return skill.disabled
    default:            return true
  }
}

function statusLabel(skill: SkillEntry): { label: string; className: string } {
  if (skill.disabled) return { label: "Disabled",    className: "text-muted-foreground bg-foreground/[0.06]" }
  if (skill.eligible) return { label: "Ready",       className: "text-emerald-400 bg-emerald-400/10" }
  return                     { label: "Needs Setup",  className: "text-amber-400 bg-amber-400/10" }
}

function formatName(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function statusDotClass(skill: SkillEntry): string {
  if (skill.disabled) return "bg-foreground/25"
  if (skill.eligible) return "bg-emerald-400"
  return "bg-amber-400"
}

interface SkillCardProps {
  skill: SkillEntry
  selected: boolean
  onClick: () => void
}

function SkillCard({ skill, selected, onClick }: SkillCardProps) {
  const brand = getBrand(skill.name, skill.skillKey)
  const [from, to] = getGradient(skill.skillKey)
  const Icon = getSkillIcon(skill.name, skill.skillKey)

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all text-center",
        selected
          ? "bg-primary/[0.10] ring-1 ring-primary/25"
          : "hover:bg-foreground/[0.05]"
      )}
    >
      <div className="relative">
        <div
          style={brand
            ? { background: brand.color }
            : { background: `linear-gradient(145deg, ${from}, ${to})` }
          }
          className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
        >
          {brand ? (
            <svg viewBox="0 0 24 24" width={28} height={28} fill="white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}>
              <path d={brand.path} />
            </svg>
          ) : (
            <Icon size={28} className="text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
          )}
        </div>
        <div className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
          statusDotClass(skill)
        )} />
      </div>
      <span className="text-xs font-medium text-foreground/75 leading-tight line-clamp-2 w-[84px]">
        {formatName(skill.name)}
      </span>
    </button>
  )
}

interface SkillsViewProps {
  sendRPC: SendRPC
}

export function SkillsView({ sendRPC }: SkillsViewProps) {
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<SkillEntry | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await sendRPC("skills.status", {}) as { skills?: SkillEntry[] }
      setSkills(res.skills ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function toggle(skill: SkillEntry, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (skill.always) return
    setTogglingKey(skill.skillKey)
    try {
      await sendRPC("skills.update", { skillKey: skill.skillKey, enabled: skill.disabled })
      setSkills(prev => prev.map(s =>
        s.skillKey === skill.skillKey ? { ...s, disabled: !s.disabled } : s
      ))
      if (selected?.skillKey === skill.skillKey) {
        setSelected(prev => prev ? { ...prev, disabled: !prev.disabled } : null)
      }
    } finally {
      setTogglingKey(null)
    }
  }

  const visible = skills
    .filter(s => skillFilter(s, filter))
    .filter(s => {
      if (!query) return true
      const q = query.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    })

  return (
    <div className="flex h-full overflow-hidden">

      {/* App grid panel */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Search + filter header */}
        <div className="pt-5 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto px-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search skills…"
              className={cn(
                "w-full bg-foreground/[0.05] border border-foreground/[0.08] rounded-xl",
                "pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                "outline-none focus:border-primary/30 transition-colors"
              )}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-5xl mx-auto px-6">
          {loading && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading skills…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32 text-sm text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && visible.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No skills found.
            </div>
          )}
          {!loading && !error && visible.length > 0 && (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {visible.map(skill => (
                <SkillCard
                  key={skill.skillKey}
                  skill={skill}
                  selected={selected?.skillKey === skill.skillKey}
                  onClick={() => setSelected(prev => prev?.skillKey === skill.skillKey ? null : skill)}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className={cn(
        "flex-none overflow-hidden border-l border-foreground/[0.07]",
        "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        selected ? "w-80" : "w-0"
      )}>
        <div className="w-80 h-full flex flex-col">
          {selected && (() => {
            const brand = getBrand(selected.name, selected.skillKey)
            const [from, to] = getGradient(selected.skillKey)
            const Icon = getSkillIcon(selected.name, selected.skillKey)
            const status = statusLabel(selected)
            const toggling = togglingKey === selected.skillKey
            return (
              <>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-foreground/[0.07] shrink-0">
                  <div
                    style={brand
                      ? { background: brand.color }
                      : { background: `linear-gradient(145deg, ${from}, ${to})` }
                    }
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
                  >
                    {brand ? (
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="white">
                        <path d={brand.path} />
                      </svg>
                    ) : (
                      <Icon size={18} className="text-white" />
                    )}
                  </div>
                  <span className="flex-1 text-base font-semibold text-foreground truncate">
                    {formatName(selected.name)}
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-lg bg-foreground/[0.05] border border-foreground/[0.07] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                  {selected.description && (
                    <p className="text-sm text-foreground/70 leading-relaxed">{selected.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", status.className)}>
                      {status.label}
                    </span>
                    {selected.bundled && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium text-muted-foreground bg-foreground/[0.06]">
                        Bundled
                      </span>
                    )}
                    {selected.always && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium text-muted-foreground bg-foreground/[0.06]">
                        Always on
                      </span>
                    )}
                  </div>

                  {!selected.always && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/70">Enabled</span>
                      <button
                        onClick={e => void toggle(selected, e)}
                        disabled={toggling}
                        className={cn(
                          "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
                          !selected.disabled ? "bg-primary/40" : "bg-foreground/[0.12]",
                          toggling && "opacity-50"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm",
                          !selected.disabled ? "translate-x-5" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>
                  )}

                  {selected.homepage && (
                    <a
                      href={selected.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-primary/70 hover:text-primary transition-colors truncate"
                    >
                      {selected.homepage}
                    </a>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      </div>

    </div>
  )
}
