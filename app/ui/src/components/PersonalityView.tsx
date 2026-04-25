import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentInfo } from "@/hooks/useAgentInfo"
import type { GatewayEvent, SendRPC } from "@/hooks/useGatewayWS"
import { ChatView, type Suggestion } from "@/components/ChatView"
import { MarkdownContent } from "@/components/MarkdownContent"

const PERSONALITY_SESSION = "agent:main:personality-editor"

const PERSONALITY_SUGGESTIONS: Suggestion[] = [
  {
    label: "Pick a new name",
    prompt: "I want to give my agent a new name. Suggest a few options based on my SOUL.md, then update the file once I've chosen.",
  },
  {
    label: "Change my vibe",
    prompt: "I'd like to update my agent's communication style and tone. Read the current vibe from SOUL.md, walk me through some alternatives, and rewrite it from my answers.",
  },
  {
    label: "Set boundaries",
    prompt: "I want to define what my agent should and shouldn't do — topics to avoid, access limits, or hard rules. Read my current SOUL.md and ACCESS_POLICY.md if it exists, then help me set clear boundaries.",
  },
]

const PERSONALITY_PROMPT = `You are embedded in the Personality settings page of this agent's control panel. Your purpose in this chat is to help the user read and edit the two files that define the agent's personality:

**SOUL.md** — The agent's core character:
- Identity: what kind of agent this is and its purpose
- Vibe: tone and style (formal, direct, casual, technical, etc.)
- Mission: the user's top goals the agent should actively help with
- Operating Principles: rules the agent always follows
- Communication Style: how the agent frames and delivers information
- Calibration: how the agent approaches thinking and problem solving

**USER.md** — A profile of the user:
- Basic info: name, timezone, location
- Who they are: their role and responsibilities
- What they're working on: active projects and current focus
- Key people: important contacts and collaborators
- Communication preferences: how they like to receive information

Start by reading both files so you know what's currently set, then help the user make changes. When changes are agreed, write the updated file using agents.files.set. Base all content strictly on what the user tells you — never invent or assume details.`

const FILES = ["SOUL.md", "USER.md", "IDENTITY.md"] as const
type FileName = typeof FILES[number]

const FILE_META: Record<FileName, { label: string; description: string }> = {
  "SOUL.md":     { label: "Character",    description: "How your agent thinks, talks, and operates" },
  "USER.md":     { label: "Your Profile", description: "What your agent knows about you" },
  "IDENTITY.md": { label: "Identity",     description: "Your agent's name and appearance" },
}

interface FileState {
  content: string | null
  missing: boolean
  loading: boolean
}

async function fetchFile(sendRPC: SendRPC, name: FileName): Promise<{ content: string | null; missing: boolean }> {
  try {
    const res = await sendRPC("agents.files.get", { agentId: "main", name }) as Record<string, unknown>
    const file = res?.file as Record<string, unknown> | undefined
    return {
      content: (file?.content as string) ?? null,
      missing: (file?.missing as boolean) ?? true,
    }
  } catch {
    return { content: null, missing: true }
  }
}

interface PersonalityViewProps {
  agent: AgentInfo
  saving: boolean
  updateIdentity: (name: string) => Promise<void>
  events: GatewayEvent[]
  sendRPC: SendRPC
}

export function PersonalityView({ agent, saving, updateIdentity, events, sendRPC }: PersonalityViewProps) {
  const [name, setName] = useState(agent.name)
  const [saved, setSaved] = useState(false)
  const [files, setFiles] = useState<Record<FileName, FileState>>({
    "SOUL.md":     { content: null, missing: false, loading: true },
    "USER.md":     { content: null, missing: false, loading: true },
    "IDENTITY.md": { content: null, missing: false, loading: true },
  })
  const [selected, setSelected] = useState<FileName | null>(null)

  useEffect(() => { setName(agent.name) }, [agent.name])

  useEffect(() => {
    for (const fileName of FILES) {
      void fetchFile(sendRPC, fileName).then(result => {
        setFiles(prev => ({ ...prev, [fileName]: { ...result, loading: false } }))
      })
    }
  }, [])

  const dirty = name.trim() !== agent.name

  async function save() {
    if (!dirty || saving) return
    await updateIdentity(name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const visibleFiles = FILES.filter(f => !files[f].missing)
  const selectedFile = selected ? files[selected] : null

  return (
    <div className="relative h-full">
      {/* Full-width form */}
      <div className="h-full overflow-y-auto px-8 py-8 md:pr-[27rem]">
        <div className="space-y-8">

          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">Personality</h1>
            <p className="text-sm text-muted-foreground">Customise how {agent.name} thinks, talks, and shows up.</p>
          </div>

          <div className="flex gap-6 items-start">
            {/* Left: field list */}
            <div className="w-96 shrink-0 space-y-2">
              {/* Name card */}
              <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-4 py-3 space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") void save() }}
                    placeholder="Jarvis"
                    className={cn(
                      "flex-1 min-w-0 bg-foreground/[0.04] border border-foreground/[0.08] rounded-lg px-3 py-2",
                      "text-foreground placeholder:text-muted-foreground text-sm outline-none",
                      "focus:border-primary/40 focus:bg-foreground/[0.06] transition-colors"
                    )}
                  />
                  <button
                    onClick={() => void save()}
                    disabled={!dirty || saving}
                    className={cn(
                      "shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      dirty && !saving
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : saved
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : "bg-foreground/[0.05] border border-foreground/[0.08] text-muted-foreground"
                    )}
                  >
                    {saved ? <Check size={13} /> : saving ? "…" : "Save"}
                  </button>
                </div>
              </div>

              {/* File cards */}
              {visibleFiles.map(fileName => {
                const meta = FILE_META[fileName]
                const isSelected = selected === fileName
                return (
                  <button
                    key={fileName}
                    onClick={() => setSelected(isSelected ? null : fileName)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-colors",
                      isSelected
                        ? "bg-foreground/[0.07] border-foreground/[0.14]"
                        : "bg-foreground/[0.03] border-foreground/[0.08] hover:bg-foreground/[0.06] hover:border-foreground/[0.12]"
                    )}
                  >
                    <div className="text-sm font-medium text-foreground">{meta.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{meta.description}</div>
                  </button>
                )
              })}
            </div>

            {/* Right: content panel */}
            {selected && selectedFile && (
              <div className="flex-1 min-w-0 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-5 py-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {FILE_META[selected].label}
                </div>
                {selectedFile.loading ? (
                  <div className="space-y-2.5 animate-pulse">
                    <div className="h-2.5 bg-foreground/10 rounded w-3/4" />
                    <div className="h-2.5 bg-foreground/10 rounded w-1/2" />
                    <div className="h-2.5 bg-foreground/10 rounded w-2/3" />
                    <div className="h-2.5 bg-foreground/10 rounded w-4/5" />
                  </div>
                ) : selectedFile.content ? (
                  <div className="text-sm text-foreground/80">
                    <MarkdownContent content={selectedFile.content} />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Empty</span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Floating chat panel — hidden on mobile */}
      <div className={cn(
        "hidden md:flex flex-col",
        "absolute top-6 bottom-6 right-6",
        "w-96",
        "rounded-2xl border border-foreground/[0.10]",
        "bg-background/80 backdrop-blur-xl",
        "shadow-[0_8px_40px_rgba(0,0,0,0.22),0_2px_12px_rgba(0,0,0,0.15)]",
        "overflow-hidden",
      )}>
        <div className="px-4 py-3 border-b border-foreground/[0.07] shrink-0">
          <p className="text-[11px] font-medium text-muted-foreground">
            Ask {agent.name} to make changes
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <ChatView
            events={events}
            sendRPC={sendRPC}
            agentName={agent.name}
            sessionKey={PERSONALITY_SESSION}
            systemPrompt={PERSONALITY_PROMPT}
            suggestions={PERSONALITY_SUGGESTIONS}
          />
        </div>
      </div>
    </div>
  )
}
