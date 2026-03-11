import { EditableCell } from "./editable-cell"
import type { ColumnDef } from "@tanstack/react-table"
import type { InvalidRow, SuggestedFix, TableRowData } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface ColumnsConfig {
  columnNames: Array<string>
  invalidRows: Array<InvalidRow>
  suggestedFixes: Array<SuggestedFix>
  onCellEdit: (rowIndex: number, columnId: string, value: string) => void
}

export function buildColumns({
  columnNames,
  invalidRows,
  suggestedFixes,
  onCellEdit,
}: ColumnsConfig): Array<ColumnDef<TableRowData>> {
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

  const dataColumns: Array<ColumnDef<TableRowData>> = columnNames.map(
    (col) => ({
      id: col,
      accessorFn: (row: TableRowData) => String(row[col] ?? ""),
      header: col,
      cell: ({ row }) => {
        const rowNum = row.original._rowNum
        const cellValue = String(row.original[col] ?? "")

        const error = invalidRows.find(
          (ir) => ir.row === rowNum && ir.column === col
        )

        const suggestion = suggestedFixes.find(
          (sf) => sf.row === rowNum && sf.column === col
        )

        return (
          <EditableCell
            value={cellValue}
            rowIndex={row.index}
            columnId={col}
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

  return [statusColumn, rowNumColumn, ...dataColumns]
}
