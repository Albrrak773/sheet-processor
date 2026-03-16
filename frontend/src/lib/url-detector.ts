import type { LinkType } from "./types"

const GOOGLE_SHEET_PUBLISHED_PATTERN =
  /\/spreadsheets\/d\/e\/[a-zA-Z0-9-_]+\/pub/

const GOOGLE_SHEET_PATTERNS = [
  /docs\.google\.com\/spreadsheets/,
  /\/spreadsheets\/d\//,
]

const FILE_EXTENSIONS = /\.(csv|tsv|xlsx|xls)(\?|$)/i

export function detectLinkType(url: string): LinkType {
  const trimmed = url.trim()
  if (!trimmed) return "unknown"

  if (GOOGLE_SHEET_PUBLISHED_PATTERN.test(trimmed)) {
    return "google-sheet-published"
  }

  for (const pattern of GOOGLE_SHEET_PATTERNS) {
    if (pattern.test(trimmed)) return "google-sheet"
  }

  try {
    new URL(trimmed)
  } catch {
    return "unknown"
  }

  if (FILE_EXTENSIONS.test(trimmed)) return "file-url"

  return "unknown"
}

export function getLinkTypeLabel(type: LinkType): string {
  switch (type) {
    case "google-sheet":
      return "Google Sheet"
    case "google-sheet-published":
      return "Published Google Sheet"
    case "file-url":
      return "File URL"
    case "unknown":
      return "Invalid URL"
  }
}
