import * as React from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { RowData, TableRowData, ValidationResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "@/components/validation/summary-cards"
import { MissingColumnsAlert } from "@/components/validation/missing-columns-alert"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { ActionsBar } from "@/components/actions-bar/actions-bar"
import { useValidateFromRaw } from "@/lib/queries/validation"
import { rowsToTsv } from "@/lib/exporters"
import { db } from "@/db"

interface ResultsSearch {
  sessionId: string
}

export const Route = createFileRoute("/results")({
  component: ResultsPage,
  validateSearch: (search: Record<string, unknown>): ResultsSearch => {
    return {
      sessionId: String(search.sessionId ?? ""),
    }
  },
})

function ResultsPage() {
  const { sessionId } = Route.useSearch()
  const navigate = useNavigate()
  const revalidate = useValidateFromRaw()

  const [data, setData] = React.useState<Array<TableRowData>>([])
  const [validationResult, setValidationResult] =
    React.useState<ValidationResponse | null>(null)
  const [hasChanges, setHasChanges] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      if (!sessionId) {
        navigate({ to: "/" })
        return
      }

      const session = await db.sessions.get(sessionId)
      if (!session) {
        navigate({ to: "/" })
        return
      }

      const dataWithRowNum = session.data.map((row, index) => ({
        ...row,
        _rowNum: index + 2,
      }))
      setData(dataWithRowNum)
      setValidationResult(session.validationResult)
      setLoading(false)
    }
    load()
  }, [sessionId, navigate])

  const handleCellEdit = React.useCallback(
    async (rowIndex: number, columnId: string, value: string) => {
      setData((prev) => {
        const updated = [...prev]
        const rowNum = prev[rowIndex]?._rowNum
        updated[rowIndex] = {
          ...updated[rowIndex],
          [columnId]: value,
          _rowNum: rowNum,
        }
        return updated
      })
      setHasChanges(true)

      const session = await db.sessions.get(sessionId)
      if (session) {
        const updatedData = [...session.data]
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          [columnId]: value,
        }
        await db.sessions.update(sessionId, {
          data: updatedData,
          modified: true,
        })
      }
    },
    [sessionId]
  )

  function handleRevalidate() {
    const dataWithoutRowNum: Array<RowData> = data.map(
      ({ _rowNum: _, ...rest }) => rest
    )
    const tsv = rowsToTsv(dataWithoutRowNum)
    revalidate.mutate(
      { rawData: tsv },
      {
        onSuccess: async (result) => {
          const dataWithRowNum = result.data.map((row, index) => ({
            ...row,
            _rowNum: index + 2,
          }))
          setValidationResult(result)
          setData(dataWithRowNum)
          setHasChanges(false)

          await db.sessions.update(sessionId, {
            data: result.data,
            validationResult: result,
            modified: false,
          })
        },
      }
    )
  }

  if (loading || !validationResult) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const columnNames = validationResult.columns_found

  return (
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Validation Results</h1>
          <p className="text-sm text-muted-foreground">
            {validationResult.valid
              ? "All data is valid"
              : "Issues found - click cells to edit"}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          New Validation
        </Button>
      </div>

      <SummaryCards result={validationResult} />

      <MissingColumnsAlert
        columns={validationResult.missing_columns}
        details={validationResult.details}
      />

      <ActionsBar
        data={data}
        onRevalidate={handleRevalidate}
        isRevalidating={revalidate.isPending}
        hasChanges={hasChanges}
      />

      <DataTable
        data={data}
        columnNames={columnNames}
        invalidRows={validationResult.invalid_rows}
        suggestedFixes={validationResult.suggested_fixes}
        onCellEdit={handleCellEdit}
      />
    </div>
  )
}
