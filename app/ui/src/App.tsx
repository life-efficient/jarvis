import { useState, useEffect } from "react"
import { ChevronLeft, Grip, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGatewayWS, type ConnectionStatus } from "@/hooks/useGatewayWS"
import { useTheme } from "@/hooks/useTheme"
import { useAgentInfo } from "@/hooks/useAgentInfo"
import { ChatView } from "@/components/ChatView"
import { EventsView } from "@/components/EventsView"
import { ThemeView } from "@/components/ThemeView"
import { SkillsView } from "@/components/SkillsView"
import { PersonalityView } from "@/components/PersonalityView"
import { MenuOverlay } from "@/components/MenuOverlay"

export type View = "chat" | "channels" | "skills" | "schedule" | "appearance" | "personality"

const activityColor: Record<ConnectionStatus, string> = {
  connecting:   "text-yellow-400/60",
  connected:    "text-emerald-400",
  disconnected: "text-muted-foreground",
  error:        "text-destructive",
}

export default function App() {
  const { events, status, sendRPC } = useGatewayWS()
  useTheme()
  const { agent, saving, updateIdentity } = useAgentInfo(sendRPC, status)

  useEffect(() => { document.title = agent.name }, [agent.name])
  const [view, setView] = useState<View>("chat")
  const [menuOpen, setMenuOpen] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)

  const isSubView = view !== "chat"

  function openMenu() { setMenuOpen(true) }
  function closeMenu() { setMenuOpen(false); setView("chat") }
  function navigate(v: View) { setView(v); setMenuOpen(false) }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "`") {
        setLogsOpen(v => !v)
        return
      }
      if (e.key !== "Escape") return
      if (menuOpen) { closeMenu(); return }
      if (isSubView) { openMenu() }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [menuOpen, isSubView])

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-foreground/[0.06]">
        <button
          onClick={openMenu}
          className="w-9 h-9 rounded-full bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isSubView ? "Back to menu" : "Open menu"}
        >
          {isSubView ? <ChevronLeft size={16} /> : <Grip size={16} />}
        </button>

        <span className="flex-1 text-center text-sm font-semibold tracking-widest text-foreground/80">
          {agent.name.toLowerCase()}
        </span>

        <div className="w-9 h-9" />
      </header>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0">
          {view === "chat"        && <ChatView events={events} sendRPC={sendRPC} agentName={agent.name} />}
          {view === "channels"    && <PlaceholderView title="Channels" description="WhatsApp, Telegram, and more — coming soon." />}
          {view === "skills"      && <SkillsView sendRPC={sendRPC} />}
          {view === "schedule"    && <PlaceholderView title="Schedule & Reminders" description="Recurring tasks and reminders — coming soon." />}
          {view === "appearance"  && <ThemeView />}
          {view === "personality" && <PersonalityView agent={agent} saving={saving} updateIdentity={updateIdentity} />}
        </div>

        <div className={cn(
          "shrink-0 flex flex-col overflow-hidden border-l border-foreground/[0.07]",
          "transition-[width] duration-300 ease-in-out",
          logsOpen ? "w-80" : "w-0"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.07] shrink-0 w-80">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Event Stream</span>
            <button
              onClick={() => setLogsOpen(false)}
              className="w-7 h-7 rounded-lg bg-foreground/[0.05] border border-foreground/[0.07] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close event stream"
            >
              <X size={12} />
            </button>
          </div>
          <div className="w-80 flex-1 min-h-0 overflow-hidden">
            <EventsView events={events} />
          </div>
        </div>
      </div>

      <MenuOverlay
        open={menuOpen}
        onClose={closeMenu}
        onNavigate={navigate}
      />
    </div>
  )
}

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-3">
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground max-w-xs">{description}</div>
    </div>
  )
}
