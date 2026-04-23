import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentInfo } from "@/hooks/useAgentInfo"

interface PersonalityViewProps {
  agent: AgentInfo
  saving: boolean
  updateIdentity: (name: string) => Promise<void>
}

export function PersonalityView({ agent, saving, updateIdentity }: PersonalityViewProps) {
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
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">
      <div className="w-full max-w-sm space-y-6">

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
  )
}
