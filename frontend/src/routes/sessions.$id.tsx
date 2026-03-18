import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  GenderValue,
  RowData,
  TableRowData,
  ValidationResponse,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "@/components/validation/summary-cards"
import { MissingColumnsAlert } from "@/components/validation/missing-columns-alert"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { ActionsBar } from "@/components/actions-bar/actions-bar"
import { GenderColumnModal } from "@/components/validation/gender-column-modal"
import { GenderMappingModal } from "@/components/validation/gender-mapping-modal"
import { useValidateFromRaw } from "@/lib/queries/validation"
import { rowsToTsv } from "@/lib/exporters"
import { createGenderAlias, getSession, updateSession } from "@/lib/api-client"
import { SessionPageSkeleton } from "@/components/skeletons/session-page-skeleton"

export const Route = createFileRoute("/sessions/$id")({
  component: SessionPage,
})

function SessionPage() {
  const { id } = Route.useParams()
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
  const [genderModalOpen, setGenderModalOpen] = React.useState(false)
  const [genderMappingModalOpen, setGenderMappingModalOpen] =
    React.useState(false)
  const [isSubmittingMappings, setIsSubmittingMappings] = React.useState(false)

  React.useEffect(() => {
    setData([])
    setValidationResult(null)
    setHasChanges(false)
    initialValidationDone.current = false
  }, [id])

  React.useEffect(() => {
    if (session) {
      const dataWithRowNum = session.data.map((row, index) => ({
        ...row,
        _rowNum: index + 2,
      }))
      setData(dataWithRowNum)

      if (!initialValidationDone.current) {
        initialValidationDone.current = true
        const tsv = rowsToTsv(session.data)
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

  function handleGenderColumnConfirm(
    genderColumn: Record<string, GenderValue>,
    nameColumn: string
  ) {
    if (!session) return

    const updatedData = data.map((row) => {
      const nameValue = String(row[nameColumn] ?? "").trim()
      const gender: string = genderColumn[nameValue] ?? ""
      const { _rowNum, ...rest } = row
      return {
        ...rest,
        gender,
        _rowNum,
      }
    })

    setData(updatedData)
    setHasChanges(true)

    const dataWithoutRowNum: Array<RowData> = updatedData.map(
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
            toast.success("Gender column added and data revalidated")
          } catch {
            toast.error("Failed to save data with gender column")
          }
        },
        onError: () => {
          toast.error("Validation failed")
        },
      }
    )
  }

  const hasGenderMissing =
    validationResult?.missing_columns.includes("gender") ?? false
  const hasUnmappedGenders =
    (validationResult?.unmapped_genders.length ?? 0) > 0

  async function handleGenderMappingConfirm(
    mappings: Map<string, GenderValue>
  ) {
    if (!session) return

    setIsSubmittingMappings(true)

    try {
      for (const [unmappedValue, gender] of mappings) {
        await createGenderAlias(gender, unmappedValue)
      }

      toast.success("Gender aliases created")

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
              setGenderMappingModalOpen(false)
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
    } catch {
      toast.error("Failed to create gender aliases")
    } finally {
      setIsSubmittingMappings(false)
    }
  }

  if (isLoading || !session || !validationResult) {
    return <SessionPageSkeleton />
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
        </div>
      </div>

      <SummaryCards result={validationResult} />

      <MissingColumnsAlert
        columns={validationResult.missing_columns}
        details={validationResult.details}
        onCreateGenderColumn={
          hasGenderMissing ? () => setGenderModalOpen(true) : undefined
        }
        unmappedGenders={validationResult.unmapped_genders}
        onMapGenders={
          hasUnmappedGenders ? () => setGenderMappingModalOpen(true) : undefined
        }
      />

      <ActionsBar
        data={data}
        onRevalidate={handleRevalidate}
        isRevalidating={revalidate.isPending}
        hasChanges={hasChanges}
        showGenderButton={hasGenderMissing}
        onShowGenderModal={() => setGenderModalOpen(true)}
      />

      <DataTable
        data={data}
        columnNames={columnNames}
        invalidRows={validationResult.invalid_rows}
        suggestedFixes={validationResult.suggested_fixes}
        onCellEdit={handleCellEdit}
      />

      <GenderColumnModal
        open={genderModalOpen}
        onOpenChange={setGenderModalOpen}
        data={data}
        onConfirm={handleGenderColumnConfirm}
      />

      <GenderMappingModal
        open={genderMappingModalOpen}
        onOpenChange={setGenderMappingModalOpen}
        unmappedGenders={validationResult.unmapped_genders}
        onConfirm={handleGenderMappingConfirm}
        isSubmitting={isSubmittingMappings}
      />
    </div>
  )
}
