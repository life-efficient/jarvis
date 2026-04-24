import { useState, useEffect, useRef } from "react"
import {
  loadOrCreateDeviceIdentity,
  signDevicePayload,
  buildConnectPayload,
} from "@/lib/device-identity"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"
export type SendRPC = (method: string, params: unknown) => Promise<unknown>

export interface GatewayEvent {
  id: string
  ts: string
  raw: string
  parsed: unknown
}

const CLIENT_ID   = "webchat-ui"
const CLIENT_MODE = "webchat"
const ROLE        = "operator"
const SCOPES      = ["operator.admin", "operator.read"]

export function useGatewayWS() {
  const [events, setEvents] = useState<GatewayEvent[]>([])
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const wsRef     = useRef<WebSocket | null>(null)
  const pendingRef = useRef<Map<string, (result: unknown) => void>>(new Map())

  useEffect(() => {
    let cancelled = false

    function connect() {
      if (cancelled) return
      const proto = location.protocol === "https:" ? "wss" : "ws"
      const ws = new WebSocket(`${proto}://${location.host}/gateway-ws`)
      wsRef.current = ws

      ws.onopen = () => setStatus("connecting")

      ws.onmessage = (e: MessageEvent<string>) => {
        let parsed: unknown = null
        try { parsed = JSON.parse(e.data) } catch { /* raw text */ }

        const frame = parsed as Record<string, unknown> | null

        if (frame?.type === "event" && frame.event === "connect.challenge") {
          const nonce = (frame.payload as Record<string, unknown>)?.nonce as string | undefined
          void sendConnect(ws, nonce ?? "")
          return
        }

        if (frame?.type === "res") {
          const id = frame.id as string | undefined
          const pending = id ? pendingRef.current.get(id) : undefined
          if (pending) {
            pendingRef.current.delete(id!)
            pending(frame.result ?? frame.payload ?? frame)
            return
          }
          // connect res — no pending handler registered
          if (frame.error == null) {
            setStatus("connected")
          } else {
            addEvent(e.data, parsed)
          }
          return
        }

        addEvent(e.data, parsed)
      }

      ws.onerror = () => setStatus("error")
      ws.onclose = () => {
        setStatus("disconnected")
        if (!cancelled) setTimeout(connect, 3000)
      }
    }

    function addEvent(raw: string, parsed: unknown) {
      setEvents(prev => [...prev, {
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        raw,
        parsed,
      }])
    }

    connect()
    return () => {
      cancelled = true
      wsRef.current?.close()
    }
  }, [])

  function sendRPC(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        reject(new Error("not connected"))
        return
      }
      const id = crypto.randomUUID()
      const timer = setTimeout(() => {
        pendingRef.current.delete(id)
        reject(new Error("timeout"))
      }, 10_000)
      pendingRef.current.set(id, result => {
        clearTimeout(timer)
        resolve(result)
      })
      wsRef.current.send(JSON.stringify({ type: "req", id, method, params }))
    })
  }

  return { events, status, sendRPC }
}

async function sendConnect(ws: WebSocket, nonce: string) {
  const identity = await loadOrCreateDeviceIdentity()
  const signedAtMs = Date.now()

  const payload = buildConnectPayload({
    deviceId:   identity.deviceId,
    clientId:   CLIENT_ID,
    clientMode: CLIENT_MODE,
    role:       ROLE,
    scopes:     SCOPES,
    signedAtMs,
    nonce,
  })

  const signature = await signDevicePayload(identity.privateKey, payload)

  ws.send(JSON.stringify({
    type:   "req",
    id:     crypto.randomUUID(),
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id:       CLIENT_ID,
        version:  "0.0.1",
        platform: navigator.platform ?? "web",
        mode:     CLIENT_MODE,
      },
      role:   ROLE,
      scopes: SCOPES,
      caps:   ["tool-events"],
      device: {
        id:        identity.deviceId,
        publicKey: identity.publicKey,
        signature,
        signedAt:  signedAtMs,
        nonce,
      },
      userAgent: navigator.userAgent,
      locale:    navigator.language,
    },
  }))
}
