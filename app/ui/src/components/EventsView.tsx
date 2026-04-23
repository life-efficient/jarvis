import { useEffect, useRef, useState } from "react"
import { Copy, Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GatewayEvent } from "@/hooks/useGatewayWS"

export function EventsView({ events }: { events: GatewayEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  useEffect(() => {
    if (atBottom.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  return (
    <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto p-3 space-y-1 font-mono text-xs">
      {events.length === 0 && (
        <p className="text-muted-foreground p-4">Waiting for events…</p>
      )}
      {events.map(e => <EventEntry key={e.id} event={e} />)}
      <div ref={bottomRef} />
    </div>
  )
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 5)  return "just now"
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function eventLabel(parsed: unknown): string {
  if (!parsed || typeof parsed !== "object") return "raw"
  const f = parsed as Record<string, unknown>
  if (f.type === "event" && typeof f.event === "string") return f.event
  if (f.type === "req"   && typeof f.method === "string") return `req: ${f.method}`
  if (f.type === "res")  return f.error ? "res: error" : "res: ok"
  if (typeof f.type === "string") return f.type
  return "unknown"
}

function EventEntry({ event }: { event: GatewayEvent }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const body = event.parsed !== null
    ? JSON.stringify(event.parsed, null, 2)
    : event.raw

  function copy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-lg border border-foreground/[0.07] bg-foreground/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-foreground/[0.04] transition-colors"
      >
        <ChevronRight
          size={11}
          className={cn("shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-90")}
        />
        <span className="flex-1 truncate text-foreground/80">{eventLabel(event.parsed)}</span>
        <span className="shrink-0 text-muted-foreground text-[10px]">{timeAgo(event.ts)}</span>
      </button>

      {open && (
        <div className="relative border-t border-foreground/[0.07] px-3 py-2">
          <pre className="text-foreground/60 whitespace-pre-wrap break-all leading-relaxed pr-6">{body}</pre>
          <button
            onClick={copy}
            className={cn(
              "absolute top-2 right-2 p-1 rounded-md transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
            )}
            aria-label="Copy"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>
      )}
    </div>
  )
}
