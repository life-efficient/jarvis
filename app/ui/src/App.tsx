import { useState } from "react"
import { Menu, Activity, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGatewayWS, type ConnectionStatus } from "@/hooks/useGatewayWS"
import { ChatView } from "@/components/ChatView"
import { EventsView } from "@/components/EventsView"
import { MenuOverlay } from "@/components/MenuOverlay"

export type View = "chat" | "channels" | "skills" | "schedule"

const activityColor: Record<ConnectionStatus, string> = {
  connecting:   "text-yellow-400/60",
  connected:    "text-emerald-400",
  disconnected: "text-muted-foreground",
  error:        "text-destructive",
}

export default function App() {
  const { events, status, sendRPC } = useGatewayWS()
  const [view, setView] = useState<View>("chat")
  const [menuOpen, setMenuOpen] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-white/[0.06]">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>

        <span className="flex-1 text-center text-sm font-semibold tracking-widest text-foreground/80">
          jarvis
        </span>

        <button
          onClick={() => setLogsOpen(v => !v)}
          className={cn(
            "w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center transition-colors",
            logsOpen
              ? "border-primary/40 bg-primary/10 text-primary"
              : cn("hover:text-foreground", activityColor[status])
          )}
          aria-label="Toggle event stream"
        >
          <Activity size={16} />
        </button>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Main view */}
        <div className="flex-1 min-w-0">
          {view === "chat"     && <ChatView events={events} sendRPC={sendRPC} />}
          {view === "channels" && <PlaceholderView title="Channels" description="WhatsApp, Telegram, and more — coming soon." />}
          {view === "skills"   && <PlaceholderView title="Skills" description="Configure what Jarvis can do for you — coming soon." />}
          {view === "schedule" && <PlaceholderView title="Schedule & Reminders" description="Recurring tasks and reminders — coming soon." />}
        </div>

        {/* Log panel — expands inline to the right */}
        <div className={cn(
          "shrink-0 flex flex-col overflow-hidden border-l border-white/[0.08]",
          "transition-[width] duration-300 ease-in-out",
          logsOpen ? "w-80" : "w-0"
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0 w-80">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Event Stream</span>
            <button
              onClick={() => setLogsOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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

      {menuOpen && (
        <MenuOverlay
          onClose={() => setMenuOpen(false)}
          onNavigate={v => setView(v)}
        />
      )}
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
