import Dexie from "dexie"
import type { EntityTable } from "dexie"
import type { RowData, ValidationResponse } from "@/lib/types"

export interface ValidationSession {
  id: string
  createdAt: Date
  source: {
    type: "google-sheet" | "file-url" | "upload" | "raw"
    label: string
  }
  data: Array<RowData>
  validationResult: ValidationResponse
  modified: boolean
}

const db = new Dexie("SheetProcessor") as Dexie & {
  sessions: EntityTable<ValidationSession, "id">
}

db.version(1).stores({
  sessions: "id, createdAt",
})

export { db }
