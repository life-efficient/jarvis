import { getPublicKeyAsync, signAsync, utils } from "@noble/ed25519"

type StoredIdentity = {
  version: 1
  deviceId: string
  publicKey: string
  privateKey: string
  createdAtMs: number
}

export type DeviceIdentity = {
  deviceId: string
  publicKey: string
  privateKey: string
}

const STORAGE_KEY = "openclaw-device-identity-v1"

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "")
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function fingerprintPublicKey(publicKey: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", publicKey.slice().buffer as ArrayBuffer)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function generateIdentity(): Promise<DeviceIdentity> {
  const privateKey = utils.randomPrivateKey()
  const publicKey = await getPublicKeyAsync(privateKey)
  const deviceId = await fingerprintPublicKey(publicKey)
  return { deviceId, publicKey: base64UrlEncode(publicKey), privateKey: base64UrlEncode(privateKey) }
}

export async function loadOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredIdentity
      if (parsed?.version === 1 && parsed.deviceId && parsed.publicKey && parsed.privateKey) {
        return { deviceId: parsed.deviceId, publicKey: parsed.publicKey, privateKey: parsed.privateKey }
      }
    }
  } catch { /* fall through */ }

  const identity = await generateIdentity()
  const stored: StoredIdentity = { version: 1, ...identity, createdAtMs: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  return identity
}

export async function signDevicePayload(privateKeyBase64Url: string, payload: string): Promise<string> {
  const key = base64UrlDecode(privateKeyBase64Url)
  const data = new TextEncoder().encode(payload)
  const sig = await signAsync(data, key)
  return base64UrlEncode(sig)
}

export function buildConnectPayload(params: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  nonce: string
}): string {
  return [
    "v2",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(","),
    String(params.signedAtMs),
    "",        // token (empty for auth=none)
    params.nonce,
  ].join("|")
}
