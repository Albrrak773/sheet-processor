import * as React from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { RowData, TableRowData, ValidationResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "@/components/validation/summary-cards"
import { MissingColumnsAlert } from "@/components/validation/missing-columns-alert"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { ActionsBar } from "@/components/actions-bar/actions-bar"
import { useValidateFromRaw } from "@/lib/queries/validation"
import { rowsToTsv } from "@/lib/exporters"
import { getSession, updateSession } from "@/lib/api-client"

export const Route = createFileRoute("/sessions/$id")({
  component: SessionPage,
})

function SessionPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const revalidate = useValidateFromRaw()

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => getSession(id),
  })

  const [data, setData] = React.useState<Array<TableRowData>>([])
  const [validationResult, setValidationResult] =
    React.useState<ValidationResponse | null>(null)
  const [hasChanges, setHasChanges] = React.useState(false)
  const initialValidationDone = React.useRef(false)

  React.useEffect(() => {
    if (session) {
      const dataWithRowNum = session.data.map((row, index) => ({
        ...row,
        _rowNum: index + 2,
      }))
      setData(dataWithRowNum)

      if (!initialValidationDone.current) {
        initialValidationDone.current = true
        const dataWithoutRowNum: Array<RowData> = dataWithRowNum.map(
          ({ _rowNum: _, ...rest }) => rest
        )
        const tsv = rowsToTsv(dataWithoutRowNum)
        revalidate.mutate(
          { rawData: tsv },
          {
            onSuccess: (result) => {
              setValidationResult(result)
            },
            onError: () => {
              toast.error("Failed to validate data")
            },
          }
        )
      }
    }
  }, [session])

  const handleCellEdit = React.useCallback(
    (rowIndex: number, columnId: string, value: string) => {
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
    },
    []
  )

  async function handleSave() {
    if (!session) return

    const dataWithoutRowNum: Array<RowData> = data.map(
      ({ _rowNum: _, ...rest }) => rest
    )

    try {
      await updateSession(session.id, { data: dataWithoutRowNum })
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ["session", id] })
      toast.success("Changes saved")
    } catch {
      toast.error("Failed to save changes")
    }
  }

  function handleRevalidate() {
    if (!session) return

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

          try {
            await updateSession(session.id, { data: result.data })
            setValidationResult(result)
            setData(dataWithRowNum)
            setHasChanges(false)
            queryClient.invalidateQueries({ queryKey: ["session", id] })
            toast.success("Data revalidated and saved")
          } catch {
            toast.error("Failed to save revalidated data to server")
          }
        },
        onError: () => {
          toast.error("Validation failed")
        },
      }
    )
  }

  if (isLoading || !session || !validationResult) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const columnNames = validationResult.columns_found

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            {validationResult.valid
              ? "All data is valid"
              : "Issues found - click cells to edit"}
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && <Button onClick={handleSave}>Save Changes</Button>}
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            New Session
          </Button>
        </div>
      </div>

      <SummaryCards result={validationResult} />

      <MissingColumnsAlert columns={[]} details={validationResult.details} />

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
