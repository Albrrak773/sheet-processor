import * as React from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeftIcon, Shield01Icon } from "@hugeicons/core-free-icons"
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

interface GuestSearch {
  key?: string
}

export const Route = createFileRoute("/guest")({
  component: GuestPage,
  validateSearch: (search: Record<string, unknown>): GuestSearch => {
    return {
      key: typeof search.key === "string" ? search.key : undefined,
    }
  },
})

function GuestPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [validationResult, setValidationResult] =
    React.useState<ValidationResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!search.key) {
      navigate({ to: "/" })
      return
    }

    try {
      const stored = sessionStorage.getItem(search.key)
      if (!stored) {
        setError("Validation data not found")
        return
      }
      sessionStorage.removeItem(search.key)
      const parsed = JSON.parse(stored) as ValidationResponse
      setValidationResult(parsed)
    } catch {
      setError("Invalid validation data")
    } finally {
      setIsLoading(false)
    }
  }, [search.key, navigate])

  async function handleCopyExportToken(result: ValidationResponse) {
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
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !validationResult) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">{error ?? "No data available"}</div>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} />
          New Validation
        </Button>
      </div>
    )
  }

  const data: Array<TableRowData> = validationResult.data.map((row, index) => ({
    ...row,
    _rowNum: index + 2,
  }))

  const columnNames = reorderColumns(validationResult.columns_found)

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Validation Results</h1>
          <p className="text-sm text-muted-foreground">
            {validationResult.valid
              ? "All data is valid"
              : "Issues found - review below"}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} />
          New Validation
        </Button>
      </div>

      <SummaryCards result={validationResult} />

      <MissingColumnsAlert
        columns={validationResult.missing_columns}
        details={validationResult.details}
        unmappedGenders={validationResult.unmapped_genders}
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleCopyExportToken(validationResult)}>
          <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />
          Copy Export Token
        </Button>
      </div>

      <DataTable
        data={data}
        columnNames={columnNames}
        invalidRows={validationResult.invalid_rows}
        duplicateRows={validationResult.duplicate_rows}
        onCellEdit={() => {}}
        onRowDelete={undefined}
        showUniIdLookup={false}
      />
    </div>
  )
}