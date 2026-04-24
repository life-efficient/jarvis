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
  agentName: string
}

export function ChatView({ events, sendRPC, agentName }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const seenEventCount = useRef(0)

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  useEffect(() => {
    if (atBottom.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
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
          if (last?.role === "assistant" && last?.streaming && (last?.id === runId || last?.id === "pending")) {
            return [...prev.slice(0, -1), { ...last, id: runId as string, text: last.text + text }]
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
    setMessages(prev => [...prev,
      { id: crypto.randomUUID(), role: "user", text, ts: new Date() },
      { id: "pending", role: "assistant", text: "", ts: new Date(), streaming: true },
    ])
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
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-16">
              Say something to get started.
            </p>
          )}
          {messages.map(m => <Bubble key={m.id} message={m} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-5 pt-2">
        <div className="max-w-2xl mx-auto">
          <InputBox
            value={input}
            onChange={setInput}
            onSend={send}
            placeholder={`Message ${agentName}…`}
            busy={busy}
          />
        </div>
      </div>
    </div>
  )
}

interface InputBoxProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder: string
  busy: boolean
}

function InputBox({ value, onChange, onSend, placeholder, busy }: InputBoxProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <div className={cn(
      "flex items-end gap-2 rounded-3xl border px-4 py-3",
      "bg-foreground/[0.05] border-foreground/[0.10]",
      "shadow-[0_2px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl",
      "transition-[border-color,box-shadow] duration-200",
      "focus-within:border-primary/30 focus-within:shadow-[0_4px_28px_rgba(0,0,0,0.22),0_0_0_1px_rgba(139,92,246,0.07)]",
    )}>
      <div className="flex-1 flex items-center min-h-[2rem]">
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
          }}
          placeholder={placeholder}
          rows={1}
          style={{ maxHeight: "160px" }}
          className="w-full bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed overflow-y-auto"
        />
      </div>
      <button
        onClick={onSend}
        disabled={!value.trim() || busy}
        className={cn(
          "shrink-0 self-end w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
          value.trim() && !busy
            ? "bg-primary/20 text-primary scale-100"
            : "bg-foreground/[0.07] text-muted-foreground scale-95"
        )}
        aria-label="Send"
      >
        <Send size={13} />
      </button>
    </div>
  )
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const time = message.ts.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  return (
    <div className={cn("flex flex-col msg-in", isUser ? "items-end" : "items-start")}>
      <div className={cn(
        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? [
              "bg-gradient-to-b from-primary/30 to-primary/[0.18]",
              "border border-primary/30",
              "text-foreground rounded-br-sm",
              "shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]",
            ]
          : [
              "bg-foreground/[0.09]",
              "border border-foreground/[0.13]",
              "text-foreground rounded-bl-sm",
              "shadow-[0_1px_6px_rgba(0,0,0,0.2)]",
            ]
      )}>
        {message.streaming && !message.text
          ? <span className="dot-bounce flex gap-1 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-current" /><span className="w-1.5 h-1.5 rounded-full bg-current" /><span className="w-1.5 h-1.5 rounded-full bg-current" /></span>
          : message.text
        }
        {message.streaming && message.text && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-foreground/40 animate-pulse rounded-sm align-middle" />}
      </div>
      {!(message.streaming && !message.text) && (
        <span className="text-[10px] mt-1 px-1 select-none text-foreground/25">{time}</span>
      )}
    </div>
  )
}
