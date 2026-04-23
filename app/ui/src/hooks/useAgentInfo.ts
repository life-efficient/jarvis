import { useState, useEffect, useCallback } from "react"
import type { ConnectionStatus, SendRPC } from "./useGatewayWS"

const AGENT_ID    = "main"
const SESSION_KEY = "agent:main:main"
const STORAGE_KEY = "jarvis-agent-name"

export interface AgentInfo {
  name: string
  avatar: string | null
}

function storedName(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "Jarvis"
}

// Port of OpenClaw's mergeIdentityMarkdownContent for the name field
function mergeIdentityName(content: string | undefined, name: string): string {
  const lines = content
    ? content.replace(/\r\n/g, "\n").split("\n")
    : ["# IDENTITY.md - Agent Identity", ""]

  const result = [...lines]
  const nameLineIdx = result.findIndex(line =>
    /^\s*-\s*\*{0,2}Name\*{0,2}\s*:/i.test(line),
  )

  if (nameLineIdx >= 0) {
    result[nameLineIdx] = `- Name: ${name}`
  } else {
    const headingIdx = result.findIndex(line => line.trim().startsWith("#"))
    const insertAt = headingIdx >= 0 ? headingIdx + 1 : 0
    result.splice(insertAt, 0, `- Name: ${name}`)
  }

  return result.join("\n").replace(/\n*$/, "\n")
}

export function useAgentInfo(sendRPC: SendRPC, status: ConnectionStatus) {
  const [agent, setAgent] = useState<AgentInfo>({ name: storedName(), avatar: null })
  const [saving, setSaving] = useState(false)

  const fetchIdentity = useCallback(async () => {
    try {
      const res = await sendRPC("agent.identity.get", { sessionKey: SESSION_KEY }) as Record<string, unknown>
      const name = (res.name as string | undefined) || storedName()
      const avatar = (res.avatar as string | null) ?? null
      localStorage.setItem(STORAGE_KEY, name)
      setAgent({ name, avatar })
    } catch { /* keep current */ }
  }, [sendRPC])

  useEffect(() => {
    if (status !== "connected") return
    void fetchIdentity()
  }, [status, fetchIdentity])

  async function updateIdentity(name: string) {
    setSaving(true)
    try {
      const getRes = await sendRPC("agents.files.get", { agentId: AGENT_ID, name: "IDENTITY.md" }) as {
        file?: { content?: string; missing?: boolean }
      }
      const currentContent = getRes.file?.missing ? undefined : (getRes.file?.content ?? undefined)
      const updatedContent = mergeIdentityName(currentContent, name)

      await sendRPC("agents.files.set", {
        agentId: AGENT_ID,
        name: "IDENTITY.md",
        content: updatedContent,
      })

      await fetchIdentity()
    } finally {
      setSaving(false)
    }
  }

  return { agent, saving, updateIdentity }
}
