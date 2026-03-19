import { HugeiconsIcon } from "@hugeicons/react"
import { Delete01Icon } from "@hugeicons/core-free-icons"
import { EditableCell } from "./editable-cell"
import type { ColumnDef } from "@tanstack/react-table"
import type { InvalidRow, SuggestedFix, TableRowData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

function extractOriginalKey(displayName: string): string {
  const match = displayName.match(/^(.+?)\s*\([^)]+\)$/)
  return match ? match[1].trim() : displayName
}

interface ColumnInfo {
  displayName: string
  originalKey: string
}

interface ColumnsConfig {
  columnNames: Array<string>
  invalidRows: Array<InvalidRow>
  suggestedFixes: Array<SuggestedFix>
  onCellEdit: (rowIndex: number, columnId: string, value: string) => void
  onRowDelete?: (rowIndex: number) => void
}

export function buildColumns({
  columnNames,
  invalidRows,
  suggestedFixes,
  onCellEdit,
  onRowDelete,
}: ColumnsConfig): Array<ColumnDef<TableRowData>> {
  const columnInfos: Array<ColumnInfo> = columnNames.map((name) => ({
    displayName: name,
    originalKey: extractOriginalKey(name),
  }))

  const statusColumn: ColumnDef<TableRowData> = {
    id: "_status",
    header: "",
    size: 50,
    cell: ({ row }) => {
      const rowNum = row.original._rowNum
      const rowErrors = invalidRows.filter((ir) => ir.row === rowNum)

      if (rowErrors.length === 0) {
        return (
          <div className="flex items-center justify-center">
            <Badge
              variant="secondary"
              className="h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              &#10003;
            </Badge>
          </div>
        )
      }

      return (
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="destructive"
                className="h-5 w-5 cursor-help justify-center rounded-full p-0 text-xs"
              >
                !
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="mb-1 font-medium">
                Row {rowNum} has {rowErrors.length}{" "}
                {rowErrors.length === 1 ? "error" : "errors"}:
              </p>
              <ul className="space-y-1 text-sm">
                {rowErrors.map((err) => (
                  <li key={`${err.column}-${err.reason}`}>
                    <span className="font-medium">{err.column}</span>:{" "}
                    <span className="text-red-400">{err.reason}</span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  }

  const rowNumColumn: ColumnDef<TableRowData> = {
    id: "_rowNum",
    header: "#",
    size: 50,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original._rowNum}
      </span>
    ),
  }

  const dataColumns: Array<ColumnDef<TableRowData>> = columnInfos.map(
    ({ displayName, originalKey }) => ({
      id: displayName,
      accessorFn: (row: TableRowData) => String(row[originalKey] ?? ""),
      header: displayName,
      cell: ({ row }) => {
        const rowNum = row.original._rowNum
        const cellValue = String(row.original[originalKey] ?? "")

        const error = invalidRows.find(
          (ir) =>
            ir.row === rowNum &&
            (ir.column === originalKey || ir.column === displayName)
        )

        const suggestion = suggestedFixes.find(
          (sf) =>
            sf.row === rowNum &&
            (sf.column === originalKey || sf.column === displayName)
        )

        return (
          <EditableCell
            value={cellValue}
            rowIndex={row.index}
            columnId={originalKey}
            error={error?.reason}
            suggestedValue={
              suggestion ? String(suggestion.suggested) : undefined
            }
            onSave={onCellEdit}
          />
        )
      },
    })
  )

  const actionsColumn: ColumnDef<TableRowData> = {
    id: "_actions",
    header: "",
    size: 50,
    cell: ({ row }) => {
      if (!onRowDelete) return null

      return (
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRowDelete(row.index)}
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Delete row</TooltipContent>
          </Tooltip>
        </div>
      )
    },
  }

  return [statusColumn, rowNumColumn, ...dataColumns, actionsColumn]
}
