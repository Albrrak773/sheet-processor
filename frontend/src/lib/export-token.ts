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

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(padded)
  const bytes = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
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

export interface TokenVerificationResult {
  valid: boolean
  payload: ExportTokenPayload | null
  error?: string
}

export async function verifyExportToken(token: string): Promise<TokenVerificationResult> {
  try {
    const secret = getSigningSecret()
    const decoded = base64urlDecode(token)
    const parsed: unknown = JSON.parse(decoded)
    
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("payload" in parsed) ||
      !("signature" in parsed) ||
      typeof parsed.signature !== "string"
    ) {
      return { valid: false, payload: null, error: "Invalid token format" }
    }
    
    if (!parsed.signature.startsWith("hmac-sha256:")) {
      return { valid: false, payload: null, error: "Invalid signature format" }
    }
    
    const signatureHash = parsed.signature.replace("hmac-sha256:", "")
    const canonicalPayload = canonicalize(parsed.payload)
    const expectedSignature = await hmacSign(secret, canonicalPayload)
    
    if (signatureHash !== expectedSignature) {
      return { valid: false, payload: null, error: "Signature verification failed" }
    }
    
    return { valid: true, payload: parsed.payload as ExportTokenPayload }
  } catch {
    return { valid: false, payload: null, error: "Failed to decode token" }
  }
}

export { type ExportTokenMetadata }