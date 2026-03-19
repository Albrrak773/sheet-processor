import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import type { MemberRead, TableRowData } from "@/lib/types"
import { lookupMembers } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface UniIdLookupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: TableRowData | null
  columnNames: Array<string>
  onApply: (uniId: string) => void
}

function extractOriginalKey(displayName: string): string {
  const match = displayName.match(/^(.+?)\s*\([^)]+\)$/)
  return match ? match[1].trim() : displayName
}

function getCanonicalName(col: string): string {
  const match = col.match(/\(([^)]+)\)$/)
  return match ? match[1].trim().toLowerCase() : col.toLowerCase()
}

function findColumnValue(
  row: TableRowData,
  columnNames: Array<string>,
  canonicalName: string
): string | null {
  const column = columnNames.find((c) => getCanonicalName(c) === canonicalName)
  if (!column) return null
  const key = extractOriginalKey(column)
  const value = row[key]
  return value != null ? String(value).trim() : null
}

function UniIdLookupModal({
  open,
  onOpenChange,
  row,
  columnNames,
  onApply,
}: UniIdLookupModalProps) {
  const [searchName, setSearchName] = React.useState("")
  const [searchEmail, setSearchEmail] = React.useState("")
  const [searchPhone, setSearchPhone] = React.useState("")
  const [results, setResults] = React.useState<Array<MemberRead>>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  React.useEffect(() => {
    if (open && row) {
      const name = findColumnValue(row, columnNames, "name") ?? ""
      const email = findColumnValue(row, columnNames, "email") ?? ""
      const phone = findColumnValue(row, columnNames, "phone number") ?? ""

      setSearchName(name)
      setSearchEmail(email)
      setSearchPhone(phone)
      setResults([])
      setHasSearched(false)
    }
  }, [open, row, columnNames])

  async function handleSearch() {
    const params: { name?: string; email?: string; phone_number?: string } = {}

    if (searchName.trim()) {
      params.name = searchName.trim()
    }
    if (searchEmail.trim()) {
      params.email = searchEmail.trim()
    }
    if (searchPhone.trim()) {
      params.phone_number = searchPhone.trim()
    }

    if (Object.keys(params).length === 0) {
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const members = await lookupMembers(params)
      setResults(members)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  function handleApply(member: MemberRead) {
    onApply(member.uni_id)
    onOpenChange(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lookup Member</DialogTitle>
          <DialogDescription>
            Search for a member to apply their university ID to this row
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by email..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by phone..."
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isSearching}>
            <HugeiconsIcon icon={Search01Icon} className="mr-2 h-4 w-4" />
            {isSearching ? "Searching..." : "Search"}
          </Button>

          {hasSearched && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                Results ({results.length} found)
              </p>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members found matching your search criteria.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded border">
                  {results.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4 border-b p-3 last:border-b-0"
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="truncate font-medium">
                          {member.name}
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>ID: {member.uni_id}</span>
                          {member.email && <span>• {member.email}</span>}
                          {member.phone_number && (
                            <span>• {member.phone_number}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {member.gender}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Level {member.uni_level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {member.uni_college}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApply(member)}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { UniIdLookupModal }
