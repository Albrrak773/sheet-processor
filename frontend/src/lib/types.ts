export interface InvalidRow {
  row: number
  column: string
  value: unknown
  reason: string
}

export interface SuggestedFix {
  row: number
  column: string
  current: unknown
  suggested: unknown
}

export interface ValidationResponse {
  valid: boolean
  total_rows: number
  columns_found: Array<string>
  missing_columns: Array<string>
  invalid_rows: Array<InvalidRow>
  suggested_fixes: Array<SuggestedFix>
  details: Array<string>
  data: Array<RowData>
}

export interface UploadResponse {
  url: string
}

export type RowData = Record<string, unknown>

export interface TableRowData extends RowData {
  _rowNum: number
}

export type LinkType = "google-sheet" | "file-url" | "unknown"

export type InputSource =
  | { type: "link"; url: string; linkType: LinkType }
  | { type: "raw"; data: string }
  | { type: "upload"; file: File }
