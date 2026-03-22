import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon, Shield01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import type { TableRowData, ValidationResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "@/components/validation/summary-cards"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { transformData } from "@/lib/api-client"
import { createExportToken } from "@/lib/export-token"

interface ValidationPreviewProps {
  result: ValidationResponse
  onReset: () => void
}

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

function ValidationPreview({ result, onReset }: ValidationPreviewProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  const data: Array<TableRowData> = React.useMemo(
    () => result.data.map((row, index) => ({ ...row, _rowNum: index + 2 })),
    [result.data]
  )

  const columnNames = React.useMemo(
    () => reorderColumns(result.columns_found),
    [result.columns_found]
  )

  async function handleCopyExportToken() {
    setIsExporting(true)
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
    } catch (error) {
      if (error instanceof Error && error.message.includes("VITE_SIGNING_SECRET")) {
        toast.error("Export token not configured. Please set VITE_SIGNING_SECRET.")
      } else {
        toast.error("Failed to create export token")
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Validation Results</h2>
          <p className="text-sm text-muted-foreground">
            {result.valid
              ? "All data is valid"
              : "Issues found - review below"}
          </p>
        </div>
        <Button variant="outline" onClick={onReset}>
          <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} />
          New Validation
        </Button>
      </div>

      <SummaryCards result={result} />

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCopyExportToken} disabled={isExporting}>
          <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />
          {isExporting ? "Creating Token..." : "Copy Export Token"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
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
    </div>
  )
}

export { ValidationPreview }