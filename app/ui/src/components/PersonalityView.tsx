import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentInfo } from "@/hooks/useAgentInfo"
import type { GatewayEvent } from "@/hooks/useGatewayWS"
import { ChatView } from "@/components/ChatView"

const PERSONALITY_SESSION = "agent:main:personality-editor"

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

interface PersonalityViewProps {
  agent: AgentInfo
  saving: boolean
  updateIdentity: (name: string) => Promise<void>
  events: GatewayEvent[]
  sendRPC: (method: string, params: unknown) => void
}

export function PersonalityView({ agent, saving, updateIdentity, events, sendRPC }: PersonalityViewProps) {
  const [name, setName] = useState(agent.name)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setName(agent.name) }, [agent.name])

  const dirty = name.trim() !== agent.name

  async function save() {
    if (!dirty || saving) return
    await updateIdentity(name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="relative h-full">
      {/* Full-width form */}
      <div className="h-full overflow-y-auto px-8 py-8 md:pr-[27rem]">
        <div className="max-w-sm mx-auto space-y-8">

          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">Personality</h1>
            <p className="text-sm text-muted-foreground">Customise how {agent.name} thinks, talks, and shows up.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void save() }}
              placeholder="Jarvis"
              className={cn(
                "w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-4 py-3",
                "text-foreground placeholder:text-muted-foreground text-base outline-none",
                "focus:border-primary/40 focus:bg-foreground/[0.06] transition-colors"
              )}
            />
          </div>

          <button
            onClick={() => void save()}
            disabled={!dirty || saving}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-medium transition-all",
              dirty && !saving
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : saved
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-foreground/[0.05] border border-foreground/[0.08] text-muted-foreground"
            )}
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2"><Check size={14} /> Saved</span>
            ) : saving ? "Saving…" : "Save"}
          </button>

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
          />
        </div>
      </div>
    </div>
  )
}
