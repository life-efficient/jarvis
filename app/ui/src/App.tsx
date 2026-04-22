import { useState } from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGatewayWS, type ConnectionStatus } from "@/hooks/useGatewayWS"
import { ChatView } from "@/components/ChatView"
import { EventsView } from "@/components/EventsView"
import { MenuOverlay } from "@/components/MenuOverlay"

export type View = "chat" | "events" | "channels" | "skills" | "schedule"

const statusDot: Record<ConnectionStatus, string> = {
  connecting:   "bg-yellow-400/60",
  connected:    "bg-emerald-400",
  disconnected: "bg-muted-foreground",
  error:        "bg-destructive",
}

export default function App() {
  const { events, status } = useGatewayWS()
  const [view, setView] = useState<View>("chat")
  const [menuOpen, setMenuOpen] = useState(false)

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

        <div className="w-9 h-9 flex items-center justify-center">
          <span className={cn("w-2 h-2 rounded-full", statusDot[status])} />
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {view === "chat"     && <ChatView />}
        {view === "events"   && <EventsView events={events} />}
        {view === "channels" && <PlaceholderView title="Channels" description="WhatsApp, Telegram, and more — coming soon." />}
        {view === "skills"   && <PlaceholderView title="Skills" description="Configure what Jarvis can do for you — coming soon." />}
        {view === "schedule" && <PlaceholderView title="Schedule & Reminders" description="Recurring tasks and reminders — coming soon." />}
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
