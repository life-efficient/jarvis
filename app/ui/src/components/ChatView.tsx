import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  ts: Date
}

// Placeholder until we wire up the gateway chat API
const PLACEHOLDER: Message[] = [
  {
    id: "1",
    role: "assistant",
    text: "Hi! I'm Jarvis. How can I help you today?",
    ts: new Date(),
  },
]

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>(PLACEHOLDER)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "user",
      text,
      ts: new Date(),
    }])
    setInput("")
    // TODO: wire up gateway send
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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
            disabled={!input.trim()}
            className={cn(
              "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
              input.trim()
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
        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        isUser
          ? "bg-primary/20 border border-primary/20 text-foreground rounded-br-sm"
          : "bg-white/[0.06] border border-white/[0.08] text-foreground rounded-bl-sm"
      )}>
        {message.text}
      </div>
    </div>
  )
}
