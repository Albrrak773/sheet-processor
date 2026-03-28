import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface LookupResult {
  rowNum: number
  name: string | null
  found: boolean
  uniId: string | null
  skipped: boolean
  skipReason: "not_found" | "multiple_matches" | null
}

interface LookupAllResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: Array<LookupResult>
}

function LookupAllResultsModal({
  open,
  onOpenChange,
  results,
}: LookupAllResultsModalProps) {
  const resolved = results.filter((r) => r.found && !r.skipped)
  const notFound = results.filter((r) => r.skipReason === "not_found")
  const multipleMatches = results.filter(
    (r) => r.skipReason === "multiple_matches"
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>University ID Lookup Results</DialogTitle>
          <DialogDescription>
            Bulk lookup completed. See results below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {resolved.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="h-4 w-4"
                  strokeWidth={2}
                />
                Resolved ({resolved.length} rows)
              </p>
              <div className="max-h-32 overflow-y-auto rounded border bg-green-50 p-2 text-xs dark:bg-green-950/20">
                {resolved.map((r) => (
                  <div key={r.rowNum} className="flex justify-between">
                    <span>
                      Row {r.rowNum}
                      {r.name && `: ${r.name}`}
                    </span>
                    <span className="font-mono">{r.uniId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notFound.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="h-4 w-4"
                  strokeWidth={2}
                />
                Not Found ({notFound.length} rows)
              </p>
              <div className="max-h-32 overflow-y-auto rounded border bg-yellow-50 p-2 text-xs dark:bg-yellow-950/20">
                {notFound.map((r) => (
                  <div key={r.rowNum}>
                    Row {r.rowNum}
                    {r.name && `: ${r.name}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {multipleMatches.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  className="h-4 w-4"
                  strokeWidth={2}
                />
                Multiple Matches ({multipleMatches.length} rows)
              </p>
              <div className="max-h-32 overflow-y-auto rounded border bg-orange-50 p-2 text-xs dark:bg-orange-950/20">
                {multipleMatches.map((r) => (
                  <div key={r.rowNum}>
                    Row {r.rowNum}
                    {r.name && `: ${r.name}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No rows with university ID errors found.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { LookupAllResultsModal }
