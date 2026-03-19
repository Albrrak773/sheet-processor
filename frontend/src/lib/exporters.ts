import type { RowData } from "./types"

export function extractOriginalKey(displayName: string): string {
  const match = displayName.match(/^(.+?)\s*\([^)]+\)$/)
  return match ? match[1].trim() : displayName
}

function collectHeaders(rows: Array<RowData>): Array<string> {
  const headerSet = new Set<string>()
  for (const row of rows) {
    Object.keys(row).forEach((key) => {
      if (!key.startsWith("_")) {
        headerSet.add(key)
      }
    })
  }
  return Array.from(headerSet)
}

export function rowsToTsv(
  rows: Array<RowData>,
  columnNames?: Array<string>
): string {
  if (rows.length === 0) return ""
  const headers = columnNames ?? collectHeaders(rows)
  const escapeField = (val: string) => {
    if (
      val.includes("\t") ||
      val.includes("\n") ||
      val.includes("\r") ||
      val.includes('"')
    ) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }
  const lines = [headers.join("\t")]
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const key = extractOriginalKey(h)
          return escapeField(String(row[key] ?? ""))
        })
        .join("\t")
    )
  }
  return lines.join("\n")
}

export function rowsToCsv(
  rows: Array<RowData>,
  columnNames?: Array<string>
): string {
  if (rows.length === 0) return ""
  const headers = columnNames ?? collectHeaders(rows)
  const escapeField = (val: string) => {
    if (
      val.includes(",") ||
      val.includes('"') ||
      val.includes("\n") ||
      val.includes("\r")
    ) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }
  const lines = [headers.map(escapeField).join(",")]
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const key = extractOriginalKey(h)
          return escapeField(String(row[key] ?? ""))
        })
        .join(",")
    )
  }
  return lines.join("\n")
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadCsv(
  rows: Array<RowData>,
  columnNames?: Array<string>,
  filename = "data.csv"
) {
  const csv = rowsToCsv(rows, columnNames)
  downloadBlob(new Blob([csv], { type: "text/csv" }), filename)
}

export function downloadTsv(
  rows: Array<RowData>,
  columnNames?: Array<string>,
  filename = "data.tsv"
) {
  const tsv = rowsToTsv(rows, columnNames)
  downloadBlob(new Blob([tsv], { type: "text/tab-separated-values" }), filename)
}

export async function downloadXlsx(
  rows: Array<RowData>,
  columnNames?: Array<string>,
  filename = "data.xlsx"
) {
  const XLSX = await import("xlsx")
  const headers = columnNames ?? collectHeaders(rows)
  const exportData = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const h of headers) {
      const key = extractOriginalKey(h)
      obj[h] = row[key] ?? ""
    }
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  XLSX.writeFile(wb, filename)
}
