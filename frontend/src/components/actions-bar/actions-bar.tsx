import type { RowData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  downloadCsv,
  downloadTsv,
  downloadXlsx,
  rowsToTsv,
} from "@/lib/exporters"

interface ActionsBarProps {
  data: Array<RowData>
  onRevalidate: () => void
  isRevalidating: boolean
  hasChanges: boolean
}

function ActionsBar({
  data,
  onRevalidate,
  isRevalidating,
  hasChanges,
}: ActionsBarProps) {
  async function handleCopyTsv() {
    const tsv = rowsToTsv(data)
    await navigator.clipboard.writeText(tsv)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={onRevalidate}
        disabled={isRevalidating || !hasChanges}
        variant={hasChanges ? "default" : "outline"}
      >
        {isRevalidating ? "Re-validating..." : "Re-validate"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Download</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => downloadCsv(data)}>
            Download as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadTsv(data)}>
            Download as TSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadXlsx(data)}>
            Download as XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={handleCopyTsv}>
        Copy as TSV
      </Button>

      <Button variant="outline" asChild>
        <a href="https://sheets.new" target="_blank" rel="noopener noreferrer">
          Open Sheet
        </a>
      </Button>
    </div>
  )
}

export { ActionsBar }
