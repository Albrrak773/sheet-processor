import type { LinkType } from "./types"

const GOOGLE_SHEET_PATTERNS = [
  /docs\.google\.com\/spreadsheets/,
  /\/spreadsheets\/d\//,
]

const FILE_EXTENSIONS = /\.(csv|tsv|xlsx|xls)(\?|$)/i

export function detectLinkType(url: string): LinkType {
  const trimmed = url.trim()
  if (!trimmed) return "unknown"

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
      return "Google Sheet detected"
    case "file-url":
      return "File URL detected"
    case "unknown":
      return "Enter a valid Google Sheet or file URL (.csv, .tsv, .xlsx)"
  }
}
