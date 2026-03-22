import type { ExportToken, ExportTokenMetadata, ExportTokenPayload, RowData } from "./types"

function getSigningSecret(): string {
  const secret = import.meta.env.VITE_SIGNING_SECRET
  if (!secret) {
    throw new Error("VITE_SIGNING_SECRET is not configured")
  }
  return secret
}

function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("")
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort())
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function createExportToken(data: Array<RowData>, metadata: ExportTokenMetadata): Promise<string> {
  const secret = getSigningSecret()
  const payload: ExportTokenPayload = { data, metadata }
  const canonicalPayload = canonicalize(payload)
  const signature = await hmacSign(secret, canonicalPayload)
  const token: ExportToken = { payload, signature: `hmac-sha256:${signature}` }
  return base64urlEncode(JSON.stringify(token))
}

export { type ExportTokenMetadata }