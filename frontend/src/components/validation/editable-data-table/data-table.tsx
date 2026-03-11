import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { buildColumns } from "./columns"
import { Toolbar } from "./toolbar"
import type { FilterValue } from "./toolbar"
import type { SortingState } from "@tanstack/react-table"
import type { InvalidRow, RowData, SuggestedFix } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps {
  data: Array<RowData>
  columnNames: Array<string>
  invalidRows: Array<InvalidRow>
  suggestedFixes: Array<SuggestedFix>
  onCellEdit: (rowIndex: number, columnId: string, value: string) => void
}

function DataTable({
  data,
  columnNames,
  invalidRows,
  suggestedFixes,
  onCellEdit,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [filter, setFilter] = React.useState<FilterValue>("all")
  const [globalFilter, setGlobalFilter] = React.useState("")

  const invalidRowIndices = React.useMemo(
    () => new Set(invalidRows.map((ir) => ir.row)),
    [invalidRows]
  )

  const filteredData = React.useMemo(() => {
    if (filter === "all") return data
    return data.filter((_, index) => {
      const rowNum = index + 1
      const isInvalid = invalidRowIndices.has(rowNum)
      return filter === "invalid" ? isInvalid : !isInvalid
    })
  }, [data, filter, invalidRowIndices])

  const columns = React.useMemo(
    () =>
      buildColumns({
        columnNames,
        invalidRows,
        suggestedFixes,
        onCellEdit,
      }),
    [columnNames, invalidRows, suggestedFixes, onCellEdit]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        filter={filter}
        onFilterChange={setFilter}
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        totalRows={data.length}
        invalidRowCount={invalidRowIndices.size}
      />

      <div className="overflow-auto border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer text-xs font-semibold whitespace-nowrap select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getIsSorted() === "asc" && " ^"}
                    {header.column.getIsSorted() === "desc" && " v"}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const rowNum = row.index + 1
                const hasError = invalidRowIndices.has(rowNum)

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      hasError &&
                        "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {data.length} rows
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable }
