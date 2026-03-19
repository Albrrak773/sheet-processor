import { HugeiconsIcon } from "@hugeicons/react"
import { Delete01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { EditableCell } from "./editable-cell"
import type { ColumnDef } from "@tanstack/react-table"
import type { DuplicateInfo, InvalidRow, TableRowData } from "@/lib/types"
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

function getCanonicalName(col: string): string {
  const match = col.match(/\(([^)]+)\)$/)
  return match ? match[1].trim().toLowerCase() : col.toLowerCase()
}

interface ColumnInfo {
  displayName: string
  originalKey: string
  canonicalName: string
}

interface ColumnsConfig {
  columnNames: Array<string>
  invalidRows: Array<InvalidRow>
  duplicateRows: Array<DuplicateInfo>
  onCellEdit: (rowNum: number, columnId: string, value: string) => void
  onRowDelete?: (rowNum: number) => void
  showUniIdLookup?: boolean
  onUniIdLookup?: (rowNum: number) => void
}

export function buildColumns({
  columnNames,
  invalidRows,
  duplicateRows,
  onCellEdit,
  onRowDelete,
  showUniIdLookup,
  onUniIdLookup,
}: ColumnsConfig): Array<ColumnDef<TableRowData>> {
  const columnInfos: Array<ColumnInfo> = columnNames.map((name) => ({
    displayName: name,
    originalKey: extractOriginalKey(name),
    canonicalName: getCanonicalName(name),
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
    ({ displayName, originalKey, canonicalName }) => ({
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

        // Find duplicate info for this cell's column and row
        const duplicateInfo = duplicateRows.find(
          (d) =>
            d.duplicate_type === canonicalName &&
            d.duplicate_rows.includes(rowNum)
        )

        // Get other rows that have the same duplicate value (excluding current row)
        const otherDuplicateRows = duplicateInfo
          ? duplicateInfo.duplicate_rows.filter((r) => r !== rowNum)
          : []

        return (
          <EditableCell
            value={cellValue}
            rowNum={rowNum}
            columnId={originalKey}
            error={error?.reason}
            duplicateRows={otherDuplicateRows}
            duplicateType={duplicateInfo?.duplicate_type}
            onSave={onCellEdit}
          />
        )
      },
    })
  )

  const actionsColumn: ColumnDef<TableRowData> = {
    id: "_actions",
    header: "",
    size: 80,
    cell: ({ row }) => {
      const hasLookup = showUniIdLookup && onUniIdLookup
      const hasDelete = !!onRowDelete
      const rowNum = row.original._rowNum

      if (!hasLookup && !hasDelete) return null

      return (
        <div className="flex items-center justify-center gap-1">
          {hasLookup && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onUniIdLookup(rowNum)}
                >
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Lookup member ID</TooltipContent>
            </Tooltip>
          )}
          {hasDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRowDelete(rowNum)}
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
          )}
        </div>
      )
    },
  }

  return [statusColumn, rowNumColumn, ...dataColumns, actionsColumn]
}
