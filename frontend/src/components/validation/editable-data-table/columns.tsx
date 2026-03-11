import { EditableCell } from "./editable-cell"
import type { ColumnDef } from "@tanstack/react-table"
import type { InvalidRow, RowData, SuggestedFix } from "@/lib/types"
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
}: ColumnsConfig): Array<ColumnDef<RowData>> {
  const statusColumn: ColumnDef<RowData> = {
    id: "_status",
    header: "",
    size: 50,
    cell: ({ row }) => {
      const rowNum = row.index + 1
      const hasError = invalidRows.some((ir) => ir.row === rowNum)
      return (
        <div className="flex items-center justify-center">
          {hasError ? (
            <Badge
              variant="destructive"
              className="h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              !
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              &#10003;
            </Badge>
          )}
        </div>
      )
    },
  }

  const rowNumColumn: ColumnDef<RowData> = {
    id: "_rowNum",
    header: "#",
    size: 50,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.index + 1}</span>
    ),
  }

  const dataColumns: Array<ColumnDef<RowData>> = columnNames.map((col) => ({
    id: col,
    accessorFn: (row: RowData) => String(row[col] ?? ""),
    header: col,
    cell: ({ row }) => {
      const rowNum = row.index + 1
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
          suggestedValue={suggestion ? String(suggestion.suggested) : undefined}
          onSave={onCellEdit}
        />
      )
    },
  }))

  return [statusColumn, rowNumColumn, ...dataColumns]
}
