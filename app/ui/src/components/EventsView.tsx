import { useEffect, useRef, useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GatewayEvent } from "@/hooks/useGatewayWS"

export function EventsView({ events }: { events: GatewayEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  return (
    <div className="h-full overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
      {events.length === 0 && (
        <p className="text-muted-foreground p-4">Waiting for events…</p>
      )}
      {events.map(e => <EventEntry key={e.id} event={e} />)}
      <div ref={bottomRef} />
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
    <div className="group relative rounded-lg border-l-2 border-primary/30 bg-white/[0.03] backdrop-blur-sm px-3 py-2">
      <div className="text-muted-foreground mb-1 text-[10px]">{event.ts}</div>
      <pre className="text-foreground/70 whitespace-pre-wrap break-all leading-relaxed">{body}</pre>
      <button
        onClick={copy}
        className={cn(
          "absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-foreground hover:bg-white/10"
        )}
        aria-label="Copy"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </div>
  )
}
