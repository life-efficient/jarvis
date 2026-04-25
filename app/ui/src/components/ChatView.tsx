import { useState, useRef, useEffect } from "react"
import { Send, Square, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GatewayEvent } from "@/hooks/useGatewayWS"
import { MarkdownContent } from "@/components/MarkdownContent"

interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  text: string
  ts: Date
  streaming?: boolean
  interrupted?: boolean
  toolName?: string
  toolArgs?: unknown
  toolResult?: unknown
  toolPhase?: "running" | "done"
}

function extractText(message: unknown): string {
  if (typeof message === "string") return message
  if (message && typeof message === "object") {
    const msg = message as Record<string, unknown>
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

function formatToolName(name: string): string {
  const labels: Record<string, string> = {
    bash: "Running command",
    computer: "Using computer",
    web_search: "Searching the web",
    web_fetch: "Fetching page",
    read_file: "Reading file",
    write_file: "Writing file",
    edit_file: "Editing file",
    str_replace_editor: "Editing file",
    task: "Running task",
  }
  return labels[name] ?? name.replace(/_/g, " ")
}

export interface Suggestion {
  label: string
  prompt: string
}

interface ChatViewProps {
  events: GatewayEvent[]
  sendRPC: (method: string, params: unknown) => void
  agentName: string
  sessionKey?: string
  systemPrompt?: string
  contentClassName?: string
  suggestions?: Suggestion[]
}

export function ChatView({ events, sendRPC, agentName, sessionKey = "agent:main:main", systemPrompt, contentClassName, suggestions }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const currentRunId = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const topFadeRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const seenEventCount = useRef(0)
  const promptSent = useRef(false)
  const [suggestionsHiding, setSuggestionsHiding] = useState(false)
  const [suggestionsGone, setSuggestionsGone] = useState(false)

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    atBottom.current = distFromBottom < 60
    if (topFadeRef.current) {
      topFadeRef.current.style.height = `${Math.min(el.scrollTop, 64)}px`
    }
  }

  useEffect(() => {
    if (atBottom.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.length > 0 && !suggestionsGone) {
      setSuggestionsHiding(true)
      const t = setTimeout(() => setSuggestionsGone(true), 250)
      return () => clearTimeout(t)
    }
  }, [messages.length])

  useEffect(() => {
    if (events.length <= seenEventCount.current) return
    const newEvents = events.slice(seenEventCount.current)
    seenEventCount.current = events.length

    for (const e of newEvents) {
      const frame = e.parsed as Record<string, unknown> | null
      if (frame?.type !== "event") continue

      if (frame.event === "agent") {
        const payload = frame.payload as Record<string, unknown> | null
        if (!payload) continue
        const data = payload.data as Record<string, unknown> | null
        if (!data) continue

        // lifecycle end — clean up any stuck pending bubble and unblock input
        if (payload.stream === "lifecycle") {
          const phase = data?.phase as string | undefined
          if (phase === "end" || phase === "error") {
            currentRunId.current = null
            setBusy(false)
          }
          continue
        }

        // tool call events
        if (payload.stream === "tool") {
          const toolCallId = data.toolCallId as string
          const name = (data.name as string | undefined) ?? "tool"
          const phase = data.phase as string

          if (phase === "start") {
            const toolMsg: Message = {
              id: toolCallId,
              role: "tool",
              text: "",
              ts: new Date(),
              toolName: name,
              toolArgs: data.args,
              toolPhase: "running",
            }
            setMessages(prev => {
              const settled = prev.map(m =>
                m.role === "assistant" && m.streaming ? { ...m, streaming: false } : m
              )
              return [...settled, toolMsg]
            })
          } else if (phase === "result") {
            setMessages(prev => prev.map(m =>
              m.id === toolCallId ? { ...m, toolResult: data.result, toolPhase: "done" } : m
            ))
          }
          continue
        }

        // assistant streaming events
        if (payload.stream === "assistant" && data.text) {
          const runId = payload.runId as string
          const text = data.text as string
          if (/^\s*(NO_REPLY|NO)\s*$/.test(text)) continue
          currentRunId.current = runId
          setBusy(true)
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last?.role === "assistant" && last?.streaming && last?.id === runId) {
              return [...prev.slice(0, -1), { ...last, text }]
            }
            return [...prev, { id: runId, role: "assistant", text, ts: new Date(), streaming: true }]
          })
          continue
        }
      }

      if (frame.event !== "chat") continue

      const payload = frame.payload as Record<string, unknown> | null
      if (!payload) continue

      const { state, message, runId } = payload
      const text = extractText(message)

      if (state === "delta") {
        setBusy(true)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last?.streaming && last?.id === runId) {
            return [...prev.slice(0, -1), { ...last, id: runId as string, text }]
          }
          return [...prev, { id: (runId as string) ?? crypto.randomUUID(), role: "assistant", text, ts: new Date(), streaming: true }]
        })
      } else if (state === "final") {
        currentRunId.current = null
        setBusy(false)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last?.streaming) {
            return [...prev.slice(0, -1), { ...last, text: text || last.text, streaming: false }]
          }
          if (text) return [...prev, { id: runId as string ?? crypto.randomUUID(), role: "assistant", text, ts: new Date() }]
          return prev
        })
      } else if (state === "aborted") {
        currentRunId.current = null
        setBusy(false)
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === "assistant" && last?.streaming) {
            return [...prev.slice(0, -1), { ...last, streaming: false, interrupted: true }]
          }
          return prev
        })
      } else if (state === "error") {
        currentRunId.current = null
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

  function stop() {
    sendRPC("chat.abort", {
      sessionKey: sessionKey,
      ...(currentRunId.current ? { runId: currentRunId.current } : {}),
    })
  }

  function sendText(text: string) {
    if (!text || busy) return
    setMessages(prev => [...prev,
      { id: crypto.randomUUID(), role: "user", text, ts: new Date() },
    ])
    setInput("")
    setBusy(true)
    let message = text
    if (systemPrompt && !promptSent.current) {
      promptSent.current = true
      message = `${systemPrompt}\n\n${text}`
    }
    sendRPC("chat.send", {
      sessionKey: sessionKey,
      message,
      idempotencyKey: crypto.randomUUID(),
    })
  }

  function send() {
    sendText(input.trim())
  }

  const lastMsg = messages[messages.length - 1]
  const showBusyDots = busy && !(lastMsg?.role === "assistant" && lastMsg?.streaming)

  return (
    <div className={cn("relative h-full", contentClassName)}>
      {/* Scroll area — fills full height, bottom padding reserves space for floating input */}
      <div ref={scrollRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto py-6 pb-36">
        <div className="space-y-5 px-4">
          {messages.length === 0 && !suggestionsGone && (
            <div className={cn(
              "flex flex-col items-center gap-4 mt-16 transition-all duration-200",
              suggestionsHiding ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            )}>
              {(!suggestions || suggestions.length === 0) && (
                <p className="text-center text-sm text-muted-foreground">
                  Say something to get started.
                </p>
              )}
              {suggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 px-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => sendText(s.prompt)}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="msg-in px-3.5 py-1.5 rounded-full border border-foreground/[0.12] bg-foreground/[0.04] text-sm text-foreground/60 hover:text-foreground hover:border-foreground/[0.22] hover:bg-foreground/[0.07] transition-colors cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map(m =>
            m.role === "tool"
              ? <ToolCallBubble key={m.id} message={m} />
              : <Bubble key={m.id} message={m} />
          )}
          {showBusyDots && (
            <div className="flex items-start msg-in">
              <span className="dot-bounce flex gap-1 px-3.5 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
              </span>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Top fade — softened so background accent shows through */}
      <div ref={topFadeRef} style={{ height: 0 }} className="pointer-events-none absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/75 to-transparent" />

      {/* Frosted glass overlay — masked blur behind the input, pointer-events-none */}
      <div
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 45%), linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 45%), linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
        className="pointer-events-none absolute bottom-0 -left-8 -right-8 z-20 h-36 backdrop-blur-xl bg-gradient-to-t from-background/75 to-transparent"
      />
      {/* Input — above the overlay, never masked */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-5 pt-2">
        <InputBox
          value={input}
          onChange={setInput}
          onSend={send}
          onStop={stop}
          placeholder={`Message ${agentName}…`}
          busy={busy}
        />
      </div>
    </div>
  )
}

interface InputBoxProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  placeholder: string
  busy: boolean
}

function InputBox({ value, onChange, onSend, onStop, placeholder, busy }: InputBoxProps) {
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
      {busy ? (
        <button
          onClick={onStop}
          className="shrink-0 self-end w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-foreground/[0.09] border border-foreground/[0.12] text-foreground/60 hover:text-foreground hover:bg-foreground/[0.14]"
          aria-label="Stop"
        >
          <Square size={11} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className={cn(
            "shrink-0 self-end w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
            value.trim()
              ? "bg-primary/20 text-primary scale-100"
              : "bg-foreground/[0.07] text-muted-foreground scale-95"
          )}
          aria-label="Send"
        >
          <Send size={13} />
        </button>
      )}
    </div>
  )
}

function ToolCallBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false)
  const isDone = message.toolPhase === "done"
  const label = formatToolName(message.toolName ?? "tool")

  return (
    <div className="flex flex-col items-start gap-1 msg-in">
      <button
        onClick={() => { if (isDone) setExpanded(v => !v) }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all duration-500",
          isDone
            ? "border-foreground/[0.10] text-foreground/40 hover:text-foreground/60 hover:border-foreground/[0.18] cursor-pointer"
            : "border-foreground/[0.07] cursor-default"
        )}
      >
        <span className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500",
          isDone ? "bg-emerald-400/50" : "bg-amber-400/60 animate-pulse"
        )} />
        <span className={isDone ? undefined : "tool-shimmer"}>{label}</span>
        {isDone && (
          expanded
            ? <ChevronUp size={10} className="opacity-40" />
            : <ChevronDown size={10} className="opacity-40" />
        )}
      </button>

      {expanded && isDone && (
        <div className="ml-1 text-xs font-mono bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl p-3 space-y-3 max-w-sm w-full">
          {message.toolArgs !== undefined && (
            <div>
              <div className="text-foreground/30 uppercase tracking-wider text-[9px] mb-1">input</div>
              <pre className="text-foreground/50 whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(message.toolArgs, null, 2)}
              </pre>
            </div>
          )}
          {message.toolResult !== undefined && (
            <div>
              <div className="text-foreground/30 uppercase tracking-wider text-[9px] mb-1">result</div>
              <pre className="text-foreground/50 whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                {JSON.stringify(message.toolResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const time = message.ts.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

  if (message.interrupted && !message.text) {
    return (
      <div className="flex justify-start msg-in">
        <span className="text-xs text-foreground/25 italic px-1">You interrupted me.</span>
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col msg-in", isUser ? "items-end" : "items-start")}>
      <div className={cn(
        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
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
          : <MarkdownContent content={message.text} />
        }
      </div>
      {!(message.streaming && !message.text) && (
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10px] select-none text-foreground/25">{time}</span>
          {message.interrupted && (
            <span className="text-[10px] select-none text-foreground/20">· stopped</span>
          )}
        </div>
      )}
    </div>
  )
}
