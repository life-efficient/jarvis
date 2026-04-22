import { useEffect, useRef, useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGatewayWS, type ConnectionStatus, type GatewayEvent } from "@/hooks/useGatewayWS"

const statusLabel: Record<ConnectionStatus, string> = {
  connecting:   "connecting…",
  connected:    "● connected",
  disconnected: "○ reconnecting…",
  error:        "● error",
}

const statusClass: Record<ConnectionStatus, string> = {
  connecting:   "text-muted-foreground bg-muted",
  connected:    "text-emerald-400 bg-emerald-950",
  disconnected: "text-muted-foreground bg-muted",
  error:        "text-destructive bg-destructive/10",
}

export default function App() {
  const { events, status } = useGatewayWS()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  return (
    <div className="flex flex-col h-dvh">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border shrink-0">
        <span className="text-sm font-semibold tracking-widest text-primary">jarvis</span>
        <span className={cn("text-xs px-2 py-0.5 rounded-full", statusClass[status])}>
          {statusLabel[status]}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {events.map(e => <EventEntry key={e.id} event={e} />)}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function EventEntry({ event }: { event: GatewayEvent }) {
  const [copied, setCopied] = useState(false)

  const body = event.parsed !== null
    ? JSON.stringify(event.parsed, null, 2)
    : event.raw

  function copy() {
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group relative rounded border-l-2 border-primary/40 bg-card px-3 py-2 text-xs">
      <div className="text-muted-foreground mb-1">{event.ts}</div>
      <pre className="text-foreground/80 whitespace-pre-wrap break-all leading-relaxed">{body}</pre>
      <button
        onClick={copy}
        className={cn(
          "absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-label="Copy to clipboard"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </div>
  )
}
