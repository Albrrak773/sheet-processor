import type { RowData } from "./types"

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

export function rowsToTsv(rows: Array<RowData>): string {
  if (rows.length === 0) return ""
  const headers = collectHeaders(rows)
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
    lines.push(headers.map((h) => escapeField(String(row[h] ?? ""))).join("\t"))
  }
  return lines.join("\n")
}

export function rowsToCsv(rows: Array<RowData>): string {
  if (rows.length === 0) return ""
  const headers = collectHeaders(rows)
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
    lines.push(headers.map((h) => escapeField(String(row[h] ?? ""))).join(","))
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

export function downloadCsv(rows: Array<RowData>, filename = "data.csv") {
  const csv = rowsToCsv(rows)
  downloadBlob(new Blob([csv], { type: "text/csv" }), filename)
}

export function downloadTsv(rows: Array<RowData>, filename = "data.tsv") {
  const tsv = rowsToTsv(rows)
  downloadBlob(new Blob([tsv], { type: "text/tab-separated-values" }), filename)
}

export async function downloadXlsx(
  rows: Array<RowData>,
  filename = "data.xlsx"
) {
  const XLSX = await import("xlsx")
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  XLSX.writeFile(wb, filename)
}
