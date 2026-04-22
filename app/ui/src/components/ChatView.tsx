import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GatewayEvent } from "@/hooks/useGatewayWS"

const SESSION_KEY = "agent:main:main"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  ts: Date
  streaming?: boolean
}

function extractText(message: unknown): string {
  if (typeof message === "string") return message
  if (message && typeof message === "object") {
    const msg = message as Record<string, unknown>
    // { role, content: [{ type: "text", text: "..." }] }
    if (Array.isArray(msg.content)) {
      return msg.content
        .filter((b: unknown) => (b as Record<string,unknown>)?.type === "text")
        .map((b: unknown) => String((b as Record<string,unknown>).text ?? ""))
        .join("")
    }
    if ("text" in msg) return String(msg.text)
  }
  return ""
}

interface ChatViewProps {
  events: GatewayEvent[]
  sendRPC: (method: string, params: unknown) => void
}

export function ChatView({ events, sendRPC }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenEventCount = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Process new chat.event frames as they arrive
  useEffect(() => {
    if (events.length <= seenEventCount.current) return
    const newEvents = events.slice(seenEventCount.current)
    seenEventCount.current = events.length

    for (const e of newEvents) {
      const frame = e.parsed as Record<string, unknown> | null
      if (frame?.type !== "event" || frame?.event !== "chat") continue

      const payload = frame.payload as Record<string, unknown> | null
      if (!payload) continue

      const { state, message, runId } = payload
      const text = extractText(message)

      if (state === "delta") {
        setBusy(true)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last?.streaming && last?.id === runId) {
            return [...prev.slice(0, -1), { ...last, text: last.text + text }]
          }
          return [...prev, {
            id: runId as string ?? crypto.randomUUID(),
            role: "assistant",
            text,
            ts: new Date(),
            streaming: true,
          }]
        })
      } else if (state === "final") {
        setBusy(false)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last?.streaming) {
            const finalText = text || last.text
            return [...prev.slice(0, -1), { ...last, text: finalText, streaming: false }]
          }
          if (text) {
            return [...prev, {
              id: runId as string ?? crypto.randomUUID(),
              role: "assistant",
              text,
              ts: new Date(),
            }]
          }
          return prev
        })
      } else if (state === "aborted" || state === "error") {
        setBusy(false)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last?.streaming) {
            const errText = (payload.errorMessage as string | undefined) ?? "(error)"
            return [...prev.slice(0, -1), { ...last, text: last.text || errText, streaming: false }]
          }
          return prev
        })
      }
    }
  }, [events])

  function send() {
    const text = input.trim()
    if (!text || busy) return
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "user",
      text,
      ts: new Date(),
    }])
    setInput("")
    setBusy(true)
    sendRPC("chat.send", {
      sessionKey: SESSION_KEY,
      message: text,
      idempotencyKey: crypto.randomUUID(),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-16">
            Say something to get started.
          </p>
        )}
        {messages.map(m => <Bubble key={m.id} message={m} />)}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6 pt-2">
        <div className="flex items-end gap-3 bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl px-4 py-3 shadow-lg shadow-black/20">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="Message Jarvis…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed max-h-32"
          />
          <button
            onClick={send}
            disabled={!input.trim() || busy}
            className={cn(
              "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !busy
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-white/[0.06] text-muted-foreground"
            )}
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-primary/20 border border-primary/20 text-foreground rounded-br-sm"
          : "bg-white/[0.06] border border-white/[0.08] text-foreground rounded-bl-sm"
      )}>
        {message.text}
        {message.streaming && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-foreground/40 animate-pulse rounded-sm align-middle" />}
      </div>
    </div>
  )
}
