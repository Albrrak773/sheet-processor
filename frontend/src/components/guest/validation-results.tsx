import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Shield01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import type { TableRowData, ValidationResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "@/components/validation/summary-cards"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { MissingColumnsAlert } from "@/components/validation/missing-columns-alert"
import { transformData } from "@/lib/api-client"
import { createExportToken } from "@/lib/export-token"

const PREFERRED_COLUMN_ORDER = [
  "name",
  "university id",
  "phone number",
  "email",
  "gender",
] as const

function reorderColumns(columns: Array<string>): Array<string> {
  const remaining = new Set(columns)
  const ordered: Array<string> = []

  function getCanonicalName(col: string): string {
    const match = col.match(/\(([^)]+)\)$/)
    return match ? match[1].trim().toLowerCase() : col.toLowerCase()
  }

  for (const preferred of PREFERRED_COLUMN_ORDER) {
    const found = columns.find((c) => {
      const canonical = getCanonicalName(c)
      return canonical === preferred
    })
    if (found) {
      ordered.push(found)
      remaining.delete(found)
    }
  }

  return [...ordered, ...columns.filter((c) => remaining.has(c))]
}

interface ValidationResultsProps {
  result: ValidationResponse
  onNewValidation: () => void
}

function ValidationResults({
  result,
  onNewValidation,
}: ValidationResultsProps) {
  const [isCopying, setIsCopying] = React.useState(false)

  async function handleCopyExportToken() {
    setIsCopying(true)
    try {
      const transformed = await transformData(result.data)
      const token = await createExportToken(transformed.data, {
        row_count: transformed.data.length,
        columns: transformed.columns,
        valid: result.valid,
        validated_at: new Date().toISOString(),
        source: "sheet-processor",
      })
      await navigator.clipboard.writeText(token)
      toast.success("Export token copied to clipboard")
    } catch {
      toast.error("Failed to create export token")
    } finally {
      setIsCopying(false)
    }
  }

  const data: Array<TableRowData> = result.data.map((row, index) => ({
    ...row,
    _rowNum: index + 2,
  }))

  const columnNames = reorderColumns(result.columns_found)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Validation Results</h2>
          <p className="text-sm text-muted-foreground">
            {result.valid ? "All data is valid" : "Issues found - review below"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onNewValidation}>
            New Validation
          </Button>
          <Button onClick={handleCopyExportToken} disabled={isCopying}>
            <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />
            {isCopying ? "Copying..." : "Copy Export Token"}
          </Button>
        </div>
      </div>

      <SummaryCards result={result} />

      <MissingColumnsAlert
        columns={result.missing_columns}
        details={result.details}
        unmappedGenders={result.unmapped_genders}
      />

      <DataTable
        data={data}
        columnNames={columnNames}
        invalidRows={result.invalid_rows}
        duplicateRows={result.duplicate_rows}
        onCellEdit={() => {}}
        onRowDelete={undefined}
        showUniIdLookup={false}
      />
    </div>
  )
}

export { ValidationResults }
