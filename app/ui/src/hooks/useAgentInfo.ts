import { useState, useEffect, useCallback } from "react"
import type { ConnectionStatus, SendRPC } from "./useGatewayWS"

const SESSION_KEY = "agent:main:main"
const STORAGE_KEY = "jarvis-agent-name"

export interface AgentInfo {
  name: string
  avatar: string | null
}

function storedName(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "Jarvis"
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
      const snapshot = await sendRPC("config.get", {}) as {
        hash?: string
        config?: Record<string, unknown>
        raw?: string
      }
      const baseHash = snapshot.hash
      if (!baseHash) throw new Error("config hash missing")

      const config: Record<string, unknown> = snapshot.config
        ? JSON.parse(JSON.stringify(snapshot.config))
        : snapshot.raw
          ? JSON.parse(snapshot.raw)
          : {}

      const agentsSection = config.agents as Record<string, unknown> | undefined
      const list = agentsSection?.list as Record<string, unknown>[] | undefined
      const entry = list?.find(a => a.id === "main")
      if (entry) {
        entry.identity = { ...(entry.identity as object ?? {}), name }
      }

      await sendRPC("config.set", { raw: JSON.stringify(config, null, 2), baseHash })
      await fetchIdentity()
    } finally {
      setSaving(false)
    }
  }

  return { agent, saving, updateIdentity }
}
