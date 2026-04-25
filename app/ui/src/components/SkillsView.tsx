import { useState, useEffect } from "react"
import {
  X, Search, Globe, GitCommit, GitBranch, Rocket, Code2, FileText, Terminal,
  Layers, Palette, Shield, Zap, Activity, CheckSquare, MessageSquare,
  Bug, RotateCcw, BookMarked, ArrowUpCircle, TestTube, Wrench, Clock,
  Brain, Camera, Database, Film, Image, Lightbulb, Users, Network,
  BarChart, ScrollText, Wand2, Music, Heart, AlignLeft, Phone, Cloud,
  Webhook, Kanban,
  type LucideIcon,
} from "lucide-react"
import {
  siGithub, siGitlab, siNotion, siFigma, siGoogle, siGmail,
  siDiscord, siJira, siWhatsapp, siTelegram, siLinear, siTrello,
  siAsana, siStripe, siShopify, siAirtable, siHubspot, siZapier,
  siX, siInstagram, siYoutube, siSpotify, siDropbox,
  siZoom, siConfluence, siBitbucket, siGitkraken,
  si1password, siImessage, siApple, siMarkdown,
  siGooglegemini, siObsidian, siSignal, siSonos, siThings,
  siTmux, siPhilipshue, siNodedotjs, siOnnx,
} from "simple-icons"
import { cn } from "@/lib/utils"
import type { GatewayEvent, SendRPC } from "@/hooks/useGatewayWS"
import { ChatView, type Suggestion } from "@/components/ChatView"

interface BrandDef {
  path: string
  color: string
}

const BRAND_PATTERNS: Array<{ pattern: RegExp; brand: BrandDef }> = [
  { pattern: /github|\bgh\b/,          brand: { path: siGithub.path,        color: `#${siGithub.hex}` } },
  { pattern: /1password|1pass/,        brand: { path: si1password.path,     color: `#${si1password.hex}` } },
  { pattern: /imessage|imsg|bluebubble|imsg/, brand: { path: siImessage.path, color: `#${siImessage.hex}` } },
  { pattern: /\bapple\b/,             brand: { path: siApple.path,         color: `#${siApple.hex}` } },
  { pattern: /markdown.*pdf|pdf.*markdown|markdowntopdf/, brand: { path: siMarkdown.path, color: `#${siMarkdown.hex}` } },
  { pattern: /gemini/,                 brand: { path: siGooglegemini.path,  color: `#${siGooglegemini.hex}` } },
  { pattern: /obsidian/,               brand: { path: siObsidian.path,      color: `#${siObsidian.hex}` } },
  { pattern: /\bsignal\b/,             brand: { path: siSignal.path,        color: `#${siSignal.hex}` } },
  { pattern: /sonos|sonoscli/,         brand: { path: siSonos.path,         color: `#${siSonos.hex}` } },
  { pattern: /\bthings\b/,             brand: { path: siThings.path,        color: `#${siThings.hex}` } },
  { pattern: /\btmux\b/,               brand: { path: siTmux.path,          color: `#${siTmux.hex}` } },
  { pattern: /openhue|philips.?hue|\bhue\b/, brand: { path: siPhilipshue.path, color: `#${siPhilipshue.hex}` } },
  { pattern: /\bnode\b|nodeconnect/,   brand: { path: siNodedotjs.path,     color: `#${siNodedotjs.hex}` } },
  { pattern: /\bonnx\b|sherpa/,        brand: { path: siOnnx.path,          color: `#${siOnnx.hex}` } },
  { pattern: /gitlab/,                 brand: { path: siGitlab.path,        color: `#${siGitlab.hex}` } },
  { pattern: /bitbucket/,              brand: { path: siBitbucket.path,     color: `#${siBitbucket.hex}` } },
  { pattern: /gitkraken/,              brand: { path: siGitkraken.path,     color: `#${siGitkraken.hex}` } },
  { pattern: /notion/,                 brand: { path: siNotion.path,        color: `#${siNotion.hex}` } },
  { pattern: /figma/,                  brand: { path: siFigma.path,         color: `#${siFigma.hex}` } },
  { pattern: /gmail/,                  brand: { path: siGmail.path,         color: `#${siGmail.hex}` } },
  { pattern: /google/,                 brand: { path: siGoogle.path,        color: `#${siGoogle.hex}` } },
  { pattern: /discord/,                brand: { path: siDiscord.path,       color: `#${siDiscord.hex}` } },
  { pattern: /jira/,                   brand: { path: siJira.path,          color: `#${siJira.hex}` } },
  { pattern: /confluence/,             brand: { path: siConfluence.path,    color: `#${siConfluence.hex}` } },
  { pattern: /whatsapp|wacli/,         brand: { path: siWhatsapp.path,      color: `#${siWhatsapp.hex}` } },
  { pattern: /telegram/,               brand: { path: siTelegram.path,      color: `#${siTelegram.hex}` } },
  { pattern: /linear/,                 brand: { path: siLinear.path,        color: `#${siLinear.hex}` } },
  { pattern: /trello/,                 brand: { path: siTrello.path,        color: `#${siTrello.hex}` } },
  { pattern: /asana/,                  brand: { path: siAsana.path,         color: `#${siAsana.hex}` } },
  { pattern: /airtable/,               brand: { path: siAirtable.path,      color: `#${siAirtable.hex}` } },
  { pattern: /hubspot/,                brand: { path: siHubspot.path,       color: `#${siHubspot.hex}` } },
  { pattern: /stripe/,                 brand: { path: siStripe.path,        color: `#${siStripe.hex}` } },
  { pattern: /shopify/,                brand: { path: siShopify.path,       color: `#${siShopify.hex}` } },
  { pattern: /zapier/,                 brand: { path: siZapier.path,        color: `#${siZapier.hex}` } },
  { pattern: /\btwitter\b|\bx\b/,      brand: { path: siX.path,             color: `#${siX.hex}` } },
  { pattern: /instagram/,              brand: { path: siInstagram.path,     color: `#${siInstagram.hex}` } },
  { pattern: /youtube/,                brand: { path: siYoutube.path,       color: `#${siYoutube.hex}` } },
  { pattern: /spotify/,                brand: { path: siSpotify.path,       color: `#${siSpotify.hex}` } },
  { pattern: /dropbox/,                brand: { path: siDropbox.path,       color: `#${siDropbox.hex}` } },
  { pattern: /zoom/,                   brand: { path: siZoom.path,          color: `#${siZoom.hex}` } },
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
  if (/commit/.test(n))                        return GitCommit
  if (/\brepo\b/.test(n))                      return GitBranch
  if (/brows|fetch|http|web/.test(n))          return Globe
  if (/ship|deploy|land/.test(n))              return Rocket
  if (/qa|test|spec|flask/.test(n))            return TestTube
  if (/review|inspect/.test(n))                return Code2
  if (/investigat|debug|bug/.test(n))          return Bug
  if (/weather/.test(n))                       return Cloud
  if (/voice.*call|call.*voice/.test(n))       return Phone
  if (/webhook/.test(n))                       return Webhook
  if (/meeting|ingestion/.test(n))             return Users
  if (/video.*ingest|media.*ingest/.test(n))   return Film
  if (/video|film|movie/.test(n))              return Film
  if (/\bbrain\b/.test(n))                     return Brain
  if (/cam|snap|photo/.test(n))                return Camera
  if (/gif|image/.test(n))                     return Image
  if (/idea/.test(n))                          return Lightbulb
  if (/song|music/.test(n))                    return Music
  if (/soul.*audit|audit.*soul/.test(n))       return Heart
  if (/summar/.test(n))                        return AlignLeft
  if (/kanban|taskflow/.test(n))               return Kanban
  if (/skill.*creat|creat.*skill/.test(n))     return Wand2
  if (/session.*log|log.*session/.test(n))     return ScrollText
  if (/report/.test(n))                        return BarChart
  if (/model.*usage|usage.*model/.test(n))     return BarChart
  if (/minion|orchestrat/.test(n))             return Network
  if (/data.*research|research.*data/.test(n)) return Database
  if (/design|visual|ui/.test(n))              return Palette
  if (/plan|architect|layout/.test(n))         return Layers
  if (/doc|file|write|read/.test(n))           return FileText
  if (/search|find/.test(n))                   return Search
  if (/message|slack|chat/.test(n))            return MessageSquare
  if (/terminal|bash|shell/.test(n))           return Terminal
  if (/task|todo|check/.test(n))               return CheckSquare
  if (/health|monitor|metric/.test(n))         return Activity
  if (/security|cso|guard/.test(n))            return Shield
  if (/retro|history/.test(n))                 return RotateCcw
  if (/context|save|restore/.test(n))          return BookMarked
  if (/upgrade|update|version/.test(n))        return ArrowUpCircle
  if (/setup|config|install/.test(n))          return Wrench
  if (/cron|schedule|remind/.test(n))          return Clock
  if (/git/.test(n))                           return GitCommit
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

function buildSystemPrompt(skill: SkillEntry): string {
  const statusText = skill.disabled
    ? "disabled"
    : skill.eligible
      ? "enabled and ready to use"
      : "enabled but needs setup (not yet configured)"
  return `You are embedded in the Skills page of this agent's control panel. The user is currently viewing a specific skill:

Name: ${skill.name}
${skill.description ? `Description: ${skill.description}` : ""}
Status: ${statusText}
${skill.always ? "This skill is always-on and cannot be disabled." : ""}
${skill.bundled ? "This is a bundled skill." : ""}
${skill.homepage ? `Homepage / docs: ${skill.homepage}` : ""}
Base directory: ${skill.baseDir}

Help the user understand what this skill does, get it set up, or troubleshoot problems with it. Be concise and practical.`
}

function buildSuggestions(skill: SkillEntry): Suggestion[] {
  const suggestions: Suggestion[] = [
    {
      label: "Explain what this does",
      prompt: `What does the "${skill.name}" skill do and what can I use it for?`,
    },
  ]
  if (!skill.eligible && !skill.disabled) {
    suggestions.push({
      label: "Help me set this up",
      prompt: `I need help setting up the "${skill.name}" skill. What do I need to configure?`,
    })
  }
  suggestions.push(
    skill.disabled
      ? { label: "Enable this",  prompt: `Please enable the "${skill.name}" skill.` }
      : { label: "Disable this", prompt: `Please disable the "${skill.name}" skill.` }
  )
  suggestions.push({
    label: "Help fix this",
    prompt: `Something seems wrong with the "${skill.name}" skill — can you help me diagnose and fix it?`,
  })
  return suggestions
}

interface SkillsViewProps {
  sendRPC: SendRPC
  events: GatewayEvent[]
  agentName: string
}

export function SkillsView({ sendRPC, events, agentName }: SkillsViewProps) {
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
    <div className="relative h-full">

      {/* Scrollable grid */}
      <div className="h-full flex flex-col overflow-hidden">

        {/* Search + filter header */}
        <div className="pt-5 pb-4 shrink-0 transition-[padding] duration-300" style={{ paddingRight: selected ? "28rem" : undefined }}>
          <div className="max-w-2xl mx-auto px-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search skills…"
                className={cn(
                  "w-full bg-foreground/[0.05] border border-foreground/[0.08] rounded-xl",
                  "pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                  "outline-none focus:border-primary/30 transition-colors"
                )}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              )}
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
        <div className="flex-1 overflow-y-auto pb-8 transition-[padding] duration-300" style={{ paddingRight: selected ? "28rem" : undefined }}>
          <div className="max-w-5xl mx-auto px-6">
            {loading && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading skills…</div>
            )}
            {error && (
              <div className="flex items-center justify-center h-32 text-sm text-destructive">{error}</div>
            )}
            {!loading && !error && visible.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No skills found.</div>
            )}
            {!loading && !error && visible.length > 0 && (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
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

      {/* Floating detail + chat panel */}
      {selected && (() => {
        const brand = getBrand(selected.name, selected.skillKey)
        const [from, to] = getGradient(selected.skillKey)
        const Icon = getSkillIcon(selected.name, selected.skillKey)
        const status = statusLabel(selected)
        const toggling = togglingKey === selected.skillKey
        return (
          <div className={cn(
            "hidden md:flex flex-col",
            "absolute top-6 bottom-6 right-6",
            "w-[26rem]",
            "rounded-2xl border border-foreground/[0.10]",
            "bg-background/80 backdrop-blur-xl",
            "shadow-[0_8px_40px_rgba(0,0,0,0.22),0_2px_12px_rgba(0,0,0,0.15)]",
            "overflow-hidden",
          )}>
            {/* Skill detail */}
            <div className="shrink-0 border-b border-foreground/[0.07]">
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
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

              <div className="px-4 pb-4 space-y-2.5">
                {selected.description && (
                  <p className="text-sm text-foreground/60 leading-snug line-clamp-3">{selected.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", status.className)}>
                    {status.label}
                  </span>
                  {selected.bundled && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium text-muted-foreground bg-foreground/[0.06]">Bundled</span>
                  )}
                  {selected.always && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium text-muted-foreground bg-foreground/[0.06]">Always on</span>
                  )}
                  {!selected.always && (
                    <button
                      onClick={e => void toggle(selected, e)}
                      disabled={toggling}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ml-auto",
                        !selected.disabled ? "bg-primary/40" : "bg-foreground/[0.12]",
                        toggling && "opacity-50"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm",
                        !selected.disabled ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                  )}
                </div>
                {selected.homepage && (
                  <a
                    href={selected.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-primary/60 hover:text-primary transition-colors truncate"
                  >
                    {selected.homepage}
                  </a>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 min-h-0">
              <ChatView
                key={selected.skillKey}
                events={events}
                sendRPC={sendRPC}
                agentName={agentName}
                sessionKey={`agent:main:skill-${selected.skillKey}`}
                systemPrompt={buildSystemPrompt(selected)}
                suggestions={buildSuggestions(selected)}
              />
            </div>
          </div>
        )
      })()}

    </div>
  )
}
