import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ClassValue } from "clsx"

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

// Unicode bidirectional control/invisible formatting characters that can break URLs
const BIDI_CONTROL_PATTERN =
  /[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069\u061C\uFEFF]/g

export function sanitizeUrl(url: string): string {
  return url.replace(BIDI_CONTROL_PATTERN, "").trim()
}
