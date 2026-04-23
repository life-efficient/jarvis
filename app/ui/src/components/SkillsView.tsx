import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SendRPC } from "@/hooks/useGatewayWS"

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

interface SkillsViewProps {
  sendRPC: SendRPC
}

export function SkillsView({ sendRPC }: SkillsViewProps) {
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<SkillEntry | null>(null)
  const [skillDoc, setSkillDoc] = useState<string | null>(null)
  const [docLoading, setDocLoading] = useState(false)

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

  async function selectSkill(skill: SkillEntry) {
    setSelected(skill)
    setSkillDoc(null)
    setDocLoading(true)
    try {
      const res = await sendRPC("agents.files.get", {
        agentId: "main",
        name: skill.baseDir + "/SKILL.md",
      }) as { file?: { content?: string; missing?: boolean } }
      setSkillDoc((!res.file?.missing && res.file?.content) ? res.file.content : null)
    } catch {
      setSkillDoc(null)
    } finally {
      setDocLoading(false)
    }
  }

  async function toggle(skill: SkillEntry, e: React.MouseEvent) {
    e.stopPropagation()
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

  const visible = skills.filter(s => skillFilter(s, filter))

  return (
    <div className="flex h-full overflow-hidden">

      {/* List — fills viewport, content centered within */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="w-full max-w-xl mx-auto flex flex-col h-full">

          <div className="flex gap-2 px-5 pt-5 pb-3 shrink-0 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-base font-medium transition-colors",
                  filter === f.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {loading && (
              <div className="flex items-center justify-center h-32 text-base text-muted-foreground">Loading skills…</div>
            )}
            {error && (
              <div className="flex items-center justify-center h-32 text-base text-destructive">{error}</div>
            )}
            {!loading && !error && visible.length === 0 && (
              <div className="flex items-center justify-center h-32 text-base text-muted-foreground">No skills in this category.</div>
            )}
            {!loading && !error && visible.length > 0 && (
              <div className="space-y-2 pt-1">
                {visible.map(skill => {
                  const status = statusLabel(skill)
                  const toggling = togglingKey === skill.skillKey
                  const isSelected = selected?.skillKey === skill.skillKey
                  return (
                    <div
                      key={skill.skillKey}
                      onClick={() => void selectSkill(skill)}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border px-4 py-3.5 cursor-pointer transition-colors",
                        isSelected
                          ? "border-primary/30 bg-primary/[0.08]"
                          : "border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06]"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-foreground truncate">{skill.name}</div>
                        {skill.description && (
                          <div className="text-sm text-foreground/50 mt-1 truncate">{skill.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", status.className)}>
                          {status.label}
                        </span>
                        {!skill.always && (
                          <button
                            onClick={e => void toggle(skill, e)}
                            disabled={toggling}
                            className={cn(
                              "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                              !skill.disabled ? "bg-primary/30" : "bg-foreground/[0.12]",
                              toggling && "opacity-50"
                            )}
                          >
                            <span className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                              !skill.disabled ? "translate-x-4" : "translate-x-0.5"
                            )} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Detail panel — slides in from right edge of viewport, pushes list left */}
      <div className={cn(
        "flex-none overflow-hidden border-l border-foreground/[0.07]",
        "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        selected ? "w-[40rem]" : "w-0"
      )}>
        <div className="w-[40rem] h-full flex flex-col">
          {selected && (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-foreground/[0.07] shrink-0">
                <span className="flex-1 text-lg font-semibold text-foreground truncate">{selected.name}</span>
                <button
                  onClick={() => { setSelected(null); setSkillDoc(null) }}
                  className="w-8 h-8 rounded-lg bg-foreground/[0.05] border border-foreground/[0.07] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {docLoading ? (
                  <div className="text-base text-muted-foreground">Loading…</div>
                ) : skillDoc ? (
                  <pre className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">{skillDoc}</pre>
                ) : (
                  <div className="space-y-5">
                    {selected.description && (
                      <p className="text-base text-foreground/70 leading-relaxed">{selected.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const status = statusLabel(selected)
                        return (
                          <span className={cn("text-sm px-3 py-1 rounded-full font-medium", status.className)}>
                            {status.label}
                          </span>
                        )
                      })()}
                      {selected.bundled && (
                        <span className="text-sm px-3 py-1 rounded-full font-medium text-muted-foreground bg-foreground/[0.06]">
                          Bundled
                        </span>
                      )}
                    </div>
                    {selected.homepage && (
                      <a
                        href={selected.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-primary/70 hover:text-primary transition-colors"
                      >
                        {selected.homepage}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
