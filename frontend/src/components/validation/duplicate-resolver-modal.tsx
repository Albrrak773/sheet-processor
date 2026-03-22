import * as React from "react"
import type { DuplicateInfo, TableRowData } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DuplicateResolverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateGroups: Array<DuplicateInfo>
  data: Array<TableRowData>
  columnNames: Array<string>
  onResolve: (keepRowNum: number, deleteRowNums: Array<number>) => void
}

function extractOriginalKey(displayName: string): string {
  const match = displayName.match(/^(.+?)\s*\([^)]+\)$/)
  return match ? match[1].trim() : displayName
}

function formatDuplicateType(type: string): string {
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function DuplicateResolverModal({
  open,
  onOpenChange,
  duplicateGroups,
  data,
  columnNames,
  onResolve,
}: DuplicateResolverModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [selectedRowNum, setSelectedRowNum] = React.useState<number | null>(
    null
  )

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setSelectedRowNum(null)
    }
  }, [open])

  // Reset selection when moving to next group
  React.useEffect(() => {
    setSelectedRowNum(null)
  }, [currentIndex])

  const currentGroup = duplicateGroups[currentIndex] as
    | DuplicateInfo
    | undefined
  const totalGroups = duplicateGroups.length
  const remainingGroups = totalGroups - currentIndex - 1

  // Get the rows for the current duplicate group
  const groupRows = React.useMemo(() => {
    if (currentGroup === undefined) return []
    return currentGroup.duplicate_rows
      .map((rowNum) => data.find((row) => row._rowNum === rowNum))
      .filter((row): row is TableRowData => row !== undefined)
  }, [currentGroup, data])

  function handleResolve() {
    if (selectedRowNum === null || currentGroup === undefined) return

    const deleteRowNums = currentGroup.duplicate_rows.filter(
      (rowNum) => rowNum !== selectedRowNum
    )
    onResolve(selectedRowNum, deleteRowNums)

    // Move to next group or close if done
    if (currentIndex < totalGroups - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onOpenChange(false)
    }
  }

  if (currentGroup === undefined || groupRows.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Duplicates</DialogTitle>
            <DialogDescription>
              All duplicates have been resolved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[90vw] max-w-6xl! overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Duplicate Group {currentIndex + 1} of {totalGroups}
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700"
            >
              {formatDuplicateType(currentGroup.duplicate_type)}:{" "}
              {currentGroup.value}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Select the row you want to keep. The other{" "}
            {groupRows.length - 1 === 1 ? "row" : "rows"} will be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-auto rounded-md border">
          <RadioGroup
            value={selectedRowNum?.toString() ?? ""}
            onValueChange={(value) => setSelectedRowNum(Number(value))}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">#</TableHead>
                  {columnNames.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupRows.map((row) => {
                  const isSelected = selectedRowNum === row._rowNum
                  return (
                    <TableRow
                      key={row._rowNum}
                      className={
                        isSelected
                          ? "bg-purple-50 dark:bg-purple-950/20"
                          : "cursor-pointer hover:bg-muted/50"
                      }
                      onClick={() => setSelectedRowNum(row._rowNum)}
                    >
                      <TableCell className="text-center">
                        <RadioGroupItem
                          value={row._rowNum.toString()}
                          id={`row-${row._rowNum}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Label
                          htmlFor={`row-${row._rowNum}`}
                          className="cursor-pointer text-muted-foreground"
                        >
                          {row._rowNum}
                        </Label>
                      </TableCell>
                      {columnNames.map((col) => {
                        const key = extractOriginalKey(col)
                        const cellValue = row[key]
                        const displayValue =
                          cellValue != null && String(cellValue).trim() !== ""
                            ? String(cellValue)
                            : "-"
                        return (
                          <TableCell key={col} className="max-w-48 truncate">
                            <Label
                              htmlFor={`row-${row._rowNum}`}
                              className="cursor-pointer"
                            >
                              {displayValue}
                            </Label>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {remainingGroups} duplicate{remainingGroups !== 1 ? "s" : ""}{" "}
            remaining
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={selectedRowNum === null}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {remainingGroups > 0 ? "Keep Selected & Next" : "Keep Selected"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DuplicateResolverModal }
