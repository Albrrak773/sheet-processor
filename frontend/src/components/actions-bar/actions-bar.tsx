import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Download04Icon,
  GitMergeIcon,
  RefreshIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import type { RowData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const GoogleSheetsIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4">
    <path
      fill="currentColor"
      d="M14.25 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.75L14.25 2z"
    />
    <path fill="#0F9D58" d="M14.25 2v5.75H20L14.25 2z" />
    <path
      fill="#fff"
      d="M8 13h3v2H8v-2zm5 0h3v2h-3v-2zm-5 3h3v2H8v-2zm5 0h3v2h-3v-2z"
    />
    <path
      fill="#0F9D58"
      d="M14.25 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.75L14.25 2zm0 1.5L18.5 7.75H14.25V3.5zm-5.75 9v6h8v-6h-8zm6.5 5h-5v-4h5v4z"
    />
    <path
      fill="#fff"
      d="M8.5 13h3v1.5h-3V13zm0 2h3v1.5h-3V15zm4 0h3v1.5h-3V15zm0-2h3v1.5h-3V13z"
    />
  </svg>
)

interface ActionsBarProps {
  data: Array<RowData>
  columnNames: Array<string>
  onRevalidate: () => void
  isRevalidating: boolean
  hasChanges: boolean
  showGenderButton?: boolean
  onShowGenderModal?: () => void
  duplicateGroupCount?: number
  onShowDuplicateResolver?: () => void
  originalCsv?: string
}

function ActionsBar({
  data,
  columnNames,
  onRevalidate,
  isRevalidating,
  hasChanges,
  showGenderButton = false,
  onShowGenderModal,
  duplicateGroupCount = 0,
  onShowDuplicateResolver,
  originalCsv,
}: ActionsBarProps) {
  async function handleCopyTsv() {
    const tsv = rowsToTsv(data, columnNames)
    await navigator.clipboard.writeText(tsv)
    toast.success("Copied to clipboard")
  }

  async function handleCopyOriginalCsv() {
    if (!originalCsv) return
    await navigator.clipboard.writeText(originalCsv)
    toast.success("Original CSV copied to clipboard")
  }

  async function handleOpenSheet() {
    const tsv = rowsToTsv(data, columnNames)
    await navigator.clipboard.writeText(tsv)
    toast.success("Copied to clipboard, opening Google Sheets...")
    window.open("https://sheets.new", "_blank")
  }

  function handleDownloadCsv() {
    downloadCsv(data, columnNames)
    toast.success("Downloaded as CSV")
  }

  function handleDownloadTsv() {
    downloadTsv(data, columnNames)
    toast.success("Downloaded as TSV")
  }

  function handleDownloadXlsx() {
    downloadXlsx(data, columnNames)
    toast.success("Downloaded as XLSX")
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {duplicateGroupCount > 0 && onShowDuplicateResolver && (
          <Button
            variant="outline"
            onClick={onShowDuplicateResolver}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          >
            <HugeiconsIcon icon={GitMergeIcon} strokeWidth={2} />
            Resolve Duplicates
            <Badge
              variant="secondary"
              className="ml-1 bg-purple-100 text-purple-700"
            >
              {duplicateGroupCount}
            </Badge>
          </Button>
        )}

        {showGenderButton && onShowGenderModal && (
          <Button variant="outline" onClick={onShowGenderModal}>
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
            Create Gender Column
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadCsv}>
              Download as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadTsv}>
              Download as TSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadXlsx}>
              Download as XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={handleCopyTsv}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
          Copy as TSV
        </Button>

        {originalCsv && (
          <Button variant="outline" onClick={handleCopyOriginalCsv}>
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            Copy Original CSV
          </Button>
        )}

        <Button variant="outline" onClick={handleOpenSheet}>
          <GoogleSheetsIcon />
          Create new empty sheet
        </Button>
      </div>

      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-4">
          <Button
            onClick={onRevalidate}
            disabled={isRevalidating}
            size="lg"
            className="shadow-lg"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
            {isRevalidating ? "Re-validating..." : "Re-validate"}
          </Button>
        </div>
      )}
    </>
  )
}

export { ActionsBar }
