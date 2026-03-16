import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { DraggableColumn } from "./draggable-column"
import { DropZone } from "./drop-zone"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import type { Header, ValidationResponse } from "@/lib/types"
import { fetchHeaders } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ColumnMappingModalProps {
  open: boolean
  validationResponse: ValidationResponse | null
  onConfirm: (
    mappings: Map<string, string>,
    ignoredColumns: Array<string>
  ) => void
  isSubmitting: boolean
}

function ColumnMappingModal({
  open,
  validationResponse,
  onConfirm,
  isSubmitting,
}: ColumnMappingModalProps) {
  const [mappings, setMappings] = React.useState<Map<string, string>>(
    () => new Map()
  )
  const [ignoredColumns, setIgnoredColumns] = React.useState<Set<string>>(
    () => new Set()
  )
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [headers, setHeaders] = React.useState<Array<Header>>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const missingColumns = validationResponse?.missing_columns ?? []
  const unmappedColumns = validationResponse?.unmapped_columns ?? []

  React.useEffect(() => {
    if (open) {
      fetchHeaders().then(setHeaders).catch(console.error)
      setMappings(new Map())
      setIgnoredColumns(new Set())
      setActiveId(null)
    }
  }, [open])

  const optionalColumns = React.useMemo(() => {
    return new Set(
      headers.filter((h) => h.is_optional).map((h) => h.name.toLowerCase())
    )
  }, [headers])

  const remainingMissing = missingColumns.filter(
    (col) =>
      !mappings.has(col) &&
      !ignoredColumns.has(col) &&
      !optionalColumns.has(col.toLowerCase())
  )
  const availableUnmapped = unmappedColumns.filter(
    (col) => !Array.from(mappings.values()).includes(col)
  )

  const canSubmit = remainingMissing.length === 0

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const inputColumn = active.id as string
    const canonicalColumn = over.id as string

    if (missingColumns.includes(canonicalColumn)) {
      setIgnoredColumns((prev) => {
        const newSet = new Set(prev)
        newSet.delete(canonicalColumn)
        return newSet
      })
      setMappings((prev) => {
        const newMap = new Map(prev)
        newMap.set(canonicalColumn, inputColumn)
        return newMap
      })
    }
  }

  function handleRemoveMapping(canonicalColumn: string) {
    setMappings((prev) => {
      const newMap = new Map(prev)
      newMap.delete(canonicalColumn)
      return newMap
    })
  }

  function handleToggleIgnore(canonicalColumn: string) {
    setIgnoredColumns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(canonicalColumn)) {
        newSet.delete(canonicalColumn)
      } else {
        newSet.add(canonicalColumn)
        setMappings((m) => {
          const newMap = new Map(m)
          newMap.delete(canonicalColumn)
          return newMap
        })
      }
      return newSet
    })
  }

  function handleConfirm() {
    const optionalNotMapped = missingColumns.filter(
      (col) =>
        optionalColumns.has(col.toLowerCase()) &&
        !mappings.has(col) &&
        !ignoredColumns.has(col)
    )
    const allIgnored = new Set([...ignoredColumns, ...optionalNotMapped])
    onConfirm(mappings, Array.from(allIgnored))
  }

  const activeColumn = activeId
    ? unmappedColumns.find((col) => col === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Dialog open={open}>
        <DialogContent
          className="max-w-4xl"
          onPointerDownOutside={(e: Event) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Map Missing Columns</DialogTitle>
            <DialogDescription>
              Drag your columns to match the required ones, or ignore columns
              you don't have.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-10 py-4">
            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Your Columns
              </h4>
              <div className="flex min-h-[200px] flex-col gap-2 rounded-lg border border-dashed p-4">
                {availableUnmapped.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All columns mapped or ignored
                  </p>
                ) : (
                  availableUnmapped.map((col) => (
                    <DraggableColumn key={col} id={col} label={col} />
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Required Columns
              </h4>
              <div className="flex min-h-[200px] flex-col gap-2">
                {missingColumns.map((col) => {
                  const mappedInput = mappings.get(col)
                  const isIgnored = ignoredColumns.has(col)
                  const isOptional = optionalColumns.has(col.toLowerCase())

                  return (
                    <DropZone
                      key={col}
                      id={col}
                      label={col}
                      mappedColumn={mappedInput}
                      onRemove={() => handleRemoveMapping(col)}
                      isOptional={isOptional}
                      isIgnored={isIgnored}
                      onToggleIgnore={() => handleToggleIgnore(col)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleConfirm}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DragOverlay dropAnimation={null}>
        {activeColumn ? (
          <div className="cursor-grabbing rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            {activeColumn}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export { ColumnMappingModal }
