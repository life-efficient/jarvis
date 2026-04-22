import { X, Radio, Zap, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { View } from "@/App"

const ITEMS: { view: View; icon: React.ReactNode; label: string; description: string }[] = [
  {
    view: "channels",
    icon: <Radio size={22} />,
    label: "Channels",
    description: "WhatsApp, Telegram, and more",
  },
  {
    view: "skills",
    icon: <Zap size={22} />,
    label: "Skills",
    description: "What Jarvis can do for you",
  },
  {
    view: "schedule",
    icon: <CalendarClock size={22} />,
    label: "Schedule & Reminders",
    description: "Recurring tasks and reminders",
  },
]

interface MenuOverlayProps {
  onClose: () => void
  onNavigate: (view: View) => void
}

export function MenuOverlay({ onClose, onNavigate }: MenuOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#080810]/80 backdrop-blur-2xl"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex items-center justify-between px-6 pt-12 pb-8">
        <span className="text-2xl font-semibold tracking-tight text-foreground">Menu</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 px-4 space-y-2 overflow-y-auto pb-8">
        {ITEMS.map(item => (
          <button
            key={item.view}
            onClick={() => { onNavigate(item.view); onClose() }}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all",
              "bg-white/[0.05] border border-white/[0.08]",
              "hover:bg-white/[0.09] hover:border-white/[0.14]",
              "active:scale-[0.98]"
            )}
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
