import { ChevronLeft, Radio, Zap, CalendarClock, Palette, Sparkles } from "lucide-react"
import type { View } from "@/App"

const ITEMS: { view: View; icon: React.ReactNode; label: string }[] = [
  { view: "channels",   icon: <Radio size={32} />,         label: "Channels" },
  { view: "skills",     icon: <Zap size={32} />,           label: "Skills" },
  { view: "schedule",   icon: <CalendarClock size={32} />,  label: "Schedule" },
  { view: "appearance",  icon: <Palette size={32} />,    label: "Appearance" },
  { view: "personality", icon: <Sparkles size={32} />,   label: "Personality" },
]

interface MenuOverlayProps {
  onClose: () => void
  onNavigate: (view: View) => void
}

export function MenuOverlay({ onClose, onNavigate }: MenuOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-2xl"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-9 h-9 rounded-full bg-foreground/[0.06] border border-foreground/[0.09] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close menu"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="grid grid-cols-2 gap-12 px-12">
        {ITEMS.map(item => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className="flex flex-col items-center gap-3 text-foreground/50 hover:text-foreground transition-colors active:scale-95"
          >
            <div className="text-primary">{item.icon}</div>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
