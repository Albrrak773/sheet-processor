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
  unmapped_columns: Array<string>
  invalid_rows: Array<InvalidRow>
  suggested_fixes: Array<SuggestedFix>
  details: Array<string>
  data: Array<RowData>
  raw_csv: string
  found_genders: Array<string>
  missing_genders: Array<string>
  unmapped_genders: Array<UnmappedGender>
}

export interface HeaderAliasRead {
  id: number
  header_id: number
  header_name: string
  alias_name: string
}

export interface Header {
  id: number
  name: string
  is_optional: boolean
}

export interface UploadResponse {
  url: string
}

export type RowData = Record<string, unknown>

export interface TableRowData extends RowData {
  _rowNum: number
}

export type LinkType =
  | "google-sheet"
  | "google-sheet-published"
  | "file-url"
  | "unknown"

export type InputSource =
  | { type: "link"; url: string; linkType: LinkType }
  | { type: "raw"; data: string }
  | { type: "upload"; file: File }

export interface SessionRead {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface SessionDetail {
  id: string
  title: string
  original_csv: string
  data: Array<RowData>
  created_at: string
  updated_at: string
}

export interface SessionCreate {
  title?: string
  original_csv: string
  data: Array<RowData>
}

export interface SessionUpdate {
  title?: string
  data?: Array<RowData>
}

export type GenderValue = "Male" | "Female"

export interface UnmappedGender {
  value: string
  count: number
}

export interface GenderLookupResult {
  name: string
  gender: GenderValue | null
  is_ambiguous: boolean
}

export interface NameBatchResponse {
  created: number
  skipped: number
  created_names: Array<string>
  skipped_names: Array<string>
}

export interface GenderEntry {
  fullName: string
  firstName: string
  gender: GenderValue | null
  originalGender: GenderValue | null
  modified: boolean
}

export interface GenderAliasRead {
  id: number
  aliase_type: "Male" | "Female"
  alias: string
}

export interface NameRead {
  id: number
  name: string
  gender: GenderValue
}

export interface MemberRead {
  id: number
  name: string
  email: string | null
  phone_number: string | null
  uni_id: string
  gender: GenderValue
  uni_level: number
  uni_college: string
  created_at: string
  updated_at: string
  is_authenticated: boolean
}

export interface MemberLookupRequest {
  name?: string
  email?: string
  phone_number?: string
}
