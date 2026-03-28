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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SummaryCards } from "@/components/validation/summary-cards"
import { MissingColumnsAlert } from "@/components/validation/missing-columns-alert"
import { DataTable } from "@/components/validation/editable-data-table/data-table"
import { ActionsBar } from "@/components/actions-bar/actions-bar"
import { GenderColumnModal } from "@/components/validation/gender-column-modal"
import { GenderMappingModal } from "@/components/validation/gender-mapping-modal"
import { UniIdLookupModal } from "@/components/validation/uni-id-lookup-modal"
import { DuplicateResolverModal } from "@/components/validation/duplicate-resolver-modal"
import { useValidateFromRaw } from "@/lib/queries/validation"
import { rowsToTsv } from "@/lib/exporters"
import { createGenderAlias, getSession, updateSession } from "@/lib/api-client"
import { SessionPageSkeleton } from "@/components/skeletons/session-page-skeleton"
import { useIsAdmin } from "@/hooks/use-role"

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

  // Extract canonical name from "alias (canonical)" or use the column name directly
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

export const Route = createFileRoute("/sessions/$id")({
  component: SessionPage,
})

function SessionPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const revalidate = useValidateFromRaw()
  const isAdmin = useIsAdmin()

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [rowToDelete, setRowToDelete] = React.useState<number | null>(null)
  const [uniIdLookupOpen, setUniIdLookupOpen] = React.useState(false)
  const [lookupRowIndex, setLookupRowIndex] = React.useState<number | null>(
    null
  )
  const [duplicateResolverOpen, setDuplicateResolverOpen] =
    React.useState(false)

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
    (rowNum: number, columnId: string, value: string) => {
      setData((prev) => {
        const index = prev.findIndex((row) => row._rowNum === rowNum)
        if (index === -1) return prev
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          [columnId]: value,
          _rowNum: rowNum,
        }
        return updated
      })
      setHasChanges(true)
    },
    []
  )

  const handleRowDeleteRequest = React.useCallback((rowNum: number) => {
    setRowToDelete(rowNum)
    setDeleteDialogOpen(true)
  }, [])

  const handleUniIdLookup = React.useCallback((rowNum: number) => {
    setLookupRowIndex(rowNum)
    setUniIdLookupOpen(true)
  }, [])

  function handleRowDeleteConfirm() {
    if (rowToDelete === null || !session) return

    const updatedData = data.filter((row) => row._rowNum !== rowToDelete)
    const reindexedData = updatedData.map((row, index) => ({
      ...row,
      _rowNum: index + 2,
    }))

    setData(reindexedData)
    setDeleteDialogOpen(false)
    setRowToDelete(null)

    const dataWithoutRowNum: Array<RowData> = reindexedData.map(
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
            toast.success("Row deleted and data revalidated")
          } catch {
            toast.error("Failed to save changes after deletion")
          }
        },
        onError: () => {
          toast.error("Validation failed after deletion")
        },
      }
    )
  }

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

  function getUniIdColumnKey(): string | null {
    if (!validationResult) return null
    const column = validationResult.columns_found.find((c) => {
      const match = c.match(/\(([^)]+)\)$/)
      const canonical = match ? match[1].trim().toLowerCase() : c.toLowerCase()
      return canonical === "university id"
    })
    if (!column) return null
    const keyMatch = column.match(/^(.+?)\s*\([^)]+\)$/)
    return keyMatch ? keyMatch[1].trim() : column
  }

  function handleUniIdApply(uniId: string) {
    if (lookupRowIndex === null) return

    const columnKey = getUniIdColumnKey()
    if (!columnKey) {
      toast.error("University ID column not found")
      return
    }

    setData((prev) => {
      const index = prev.findIndex((row) => row._rowNum === lookupRowIndex)
      if (index === -1) return prev
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [columnKey]: uniId,
        _rowNum: lookupRowIndex,
      }
      return updated
    })
    setHasChanges(true)
    setUniIdLookupOpen(false)
    setLookupRowIndex(null)
    toast.success("University ID applied")
  }

  function getRowName(rowNum: number): string | null {
    const row = data.find((r) => r._rowNum === rowNum)
    if (!row || !validationResult) return null
    const nameColumn = validationResult.columns_found.find((c) => {
      const match = c.match(/\(([^)]+)\)$/)
      const canonical = match ? match[1].trim().toLowerCase() : c.toLowerCase()
      return canonical === "name"
    })
    if (!nameColumn) return null
    const keyMatch = nameColumn.match(/^(.+?)\s*\([^)]+\)$/)
    const key = keyMatch ? keyMatch[1].trim() : nameColumn
    const value = row[key]
    return value != null ? String(value).trim() : null
  }

  function handleDuplicateResolve(
    resolutions: Array<{
      keepRowNum: number
      deleteRowNums: Array<number>
    }>
  ) {
    if (!session) return

    const allDeleteRowNums = new Set<number>()
    for (const resolution of resolutions) {
      for (const rowNum of resolution.deleteRowNums) {
        allDeleteRowNums.add(rowNum)
      }
    }

    const updatedData = data.filter((row) => !allDeleteRowNums.has(row._rowNum))
    const reindexedData = updatedData.map((row, index) => ({
      ...row,
      _rowNum: index + 2,
    }))

    setData(reindexedData)

    const dataWithoutRowNum: Array<RowData> = reindexedData.map(
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
            const totalDeleted = allDeleteRowNums.size
            const groupCount = resolutions.length
            toast.success(
              `Resolved ${groupCount} duplicate group${groupCount > 1 ? "s" : ""}, deleted ${totalDeleted} row${totalDeleted > 1 ? "s" : ""}`
            )
          } catch {
            toast.error("Failed to save changes after duplicate resolution")
          }
        },
        onError: () => {
          toast.error("Validation failed after duplicate resolution")
        },
      }
    )
  }

  function handleSingleDuplicateResolve(
    keepRowNum: number,
    deleteRowNums: Array<number>
  ) {
    handleDuplicateResolve([{ keepRowNum, deleteRowNums }])
  }

  if (isLoading || !session || !validationResult) {
    return <SessionPageSkeleton />
  }

  const columnNames = reorderColumns(validationResult.columns_found)

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
        columnNames={columnNames}
        onRevalidate={handleRevalidate}
        isRevalidating={revalidate.isPending}
        hasChanges={hasChanges}
        showGenderButton={hasGenderMissing}
        onShowGenderModal={() => setGenderModalOpen(true)}
        duplicateGroupCount={validationResult.duplicate_rows.length}
        onShowDuplicateResolver={() => setDuplicateResolverOpen(true)}
        originalCsv={session.original_csv}
        isValid={validationResult.valid}
      />

      <DataTable
        data={data}
        columnNames={columnNames}
        invalidRows={validationResult.invalid_rows}
        duplicateRows={validationResult.duplicate_rows}
        onCellEdit={handleCellEdit}
        onRowDelete={handleRowDeleteRequest}
        showUniIdLookup={isAdmin}
        onUniIdLookup={handleUniIdLookup}
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

      <UniIdLookupModal
        open={uniIdLookupOpen}
        onOpenChange={setUniIdLookupOpen}
        row={
          lookupRowIndex !== null
            ? (data.find((row) => row._rowNum === lookupRowIndex) ?? null)
            : null
        }
        columnNames={columnNames}
        onApply={handleUniIdApply}
      />

      <DuplicateResolverModal
        open={duplicateResolverOpen}
        onOpenChange={setDuplicateResolverOpen}
        duplicateGroups={validationResult.duplicate_rows}
        data={data}
        columnNames={columnNames}
        onResolve={handleSingleDuplicateResolve}
        onResolveAll={handleDuplicateResolve}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Row</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {rowToDelete !== null && getRowName(rowToDelete) ? (
                <>
                  <span className="font-medium">{getRowName(rowToDelete)}</span>{" "}
                  (row {rowToDelete})
                </>
              ) : (
                "this row"
              )}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRowDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
