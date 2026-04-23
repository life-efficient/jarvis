import { useEffect, useState } from "react"
import { ChevronLeft, Radio, Zap, CalendarClock, Palette, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { View } from "@/App"

const ITEMS: { view: View; icon: React.ReactNode; label: string }[] = [
  { view: "channels",   icon: <Radio size={48} />,         label: "Channels" },
  { view: "skills",     icon: <Zap size={48} />,           label: "Skills" },
  { view: "schedule",   icon: <CalendarClock size={48} />, label: "Schedule" },
  { view: "appearance", icon: <Palette size={48} />,       label: "Appearance" },
  { view: "personality",icon: <Sparkles size={48} />,      label: "Personality" },
]

interface MenuOverlayProps {
  open: boolean
  onClose: () => void
  onNavigate: (view: View) => void
}

export function MenuOverlay({ open, onClose, onNavigate }: MenuOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      // Mount first, then trigger transition on next frame
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    } else {
      setVisible(false)
    }
  }, [open])

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/85 backdrop-blur-2xl",
        "transition-opacity duration-300 ease-in-out",
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-9 h-9 rounded-full bg-foreground/[0.06] border border-foreground/[0.09] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close menu"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        className={cn(
          "flex flex-wrap justify-center gap-16 max-w-sm",
          "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2",
        )}
      >
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
