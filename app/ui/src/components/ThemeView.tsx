import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme, ACCENT_PRESETS, FONT_PRESETS } from "@/hooks/useTheme"

export function ThemeView() {
  const { theme, setAccent, setFont, setMode } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10">

      <section className="w-full max-w-sm space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appearance</h2>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                theme.mode === m
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-foreground/[0.04] border-foreground/[0.07] text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "light" ? <Sun size={14} /> : <Moon size={14} />}
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="w-full max-w-sm space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accent colour</h2>
        <div className="flex gap-2.5 flex-wrap">
          {ACCENT_PRESETS.map(a => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              title={a.label}
              className={cn(
                "w-8 h-8 rounded-full transition-all",
                theme.accentId === a.id
                  ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                  : "opacity-60 hover:opacity-100 hover:scale-105"
              )}
              style={{ backgroundColor: a.color, ["--tw-ring-color" as string]: a.color }}
              aria-label={a.label}
            />
          ))}
        </div>
      </section>

      <section className="w-full max-w-sm space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Font</h2>
        <div className="flex flex-col gap-2">
          {FONT_PRESETS.map(f => (
            <button
              key={f.id}
              onClick={() => setFont(f.id)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                theme.fontId === f.id
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-foreground/[0.04] border-foreground/[0.07] text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground"
              )}
            >
              <span className="text-sm font-medium" style={{ fontFamily: f.family }}>{f.label}</span>
              <span className="text-xs opacity-50" style={{ fontFamily: f.family }}>Aa</span>
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}
