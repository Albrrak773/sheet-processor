import * as React from "react"
import { toast } from "sonner"
import type { GenderEntry, GenderValue, RowData } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateGenderNames, useGenderLookup } from "@/lib/queries/genders"

function normalizeName(text: string): string {
  const noDiacritics = text.replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, "")
  return noDiacritics.toLowerCase().trim()
}

function extractFirstName(fullName: string): string {
  const parts = fullName.split(/\s+/)
  return parts[0] ?? ""
}

interface GenderColumnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Array<RowData>
  onConfirm: (
    genderColumn: Record<string, GenderValue>,
    nameColumn: string
  ) => void
}

function GenderColumnModal({
  open,
  onOpenChange,
  data,
  onConfirm,
}: GenderColumnModalProps) {
  const [step, setStep] = React.useState<"select" | "assign">("select")
  const [selectedColumn, setSelectedColumn] = React.useState<string>("")
  const [entries, setEntries] = React.useState<Array<GenderEntry>>([])
  const [filterUnidentified, setFilterUnidentified] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const genderLookup = useGenderLookup()
  const createGenderNames = useCreateGenderNames()

  const columnNames = React.useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter((k) => k !== "_rowNum")
  }, [data])

  React.useEffect(() => {
    if (open && columnNames.length > 0 && !selectedColumn) {
      setSelectedColumn(columnNames[0] ?? "")
    }
  }, [open, columnNames, selectedColumn])

  React.useEffect(() => {
    if (!open) {
      setStep("select")
      setSelectedColumn("")
      setEntries([])
      setFilterUnidentified(false)
      setIsLoading(false)
    }
  }, [open])

  React.useEffect(() => {
    if (step !== "assign" || !selectedColumn) {
      return
    }

    const fullNameSet = new Set<string>()
    for (const row of data) {
      const value = row[selectedColumn]
      if (typeof value === "string" && value.trim()) {
        fullNameSet.add(value.trim())
      }
    }

    const uniqueFullNames = Array.from(fullNameSet)
    if (uniqueFullNames.length === 0) {
      setEntries([])
      return
    }

    const namesText = uniqueFullNames.join("\n")
    setIsLoading(true)

    genderLookup.mutate(namesText, {
      onSuccess: (results) => {
        const resultsMap = new Map<string, (typeof results)[0]>()
        for (const r of results) {
          resultsMap.set(r.name, r)
        }

        const newEntries: Array<GenderEntry> = uniqueFullNames.map(
          (fullName) => {
            const firstName = extractFirstName(fullName)
            const normalizedFirstName = normalizeName(firstName)
            const result = resultsMap.get(normalizedFirstName)

            return {
              fullName,
              firstName: normalizedFirstName,
              gender: result?.gender ?? null,
              originalGender: result?.gender ?? null,
              modified: false,
            }
          }
        )
        setEntries(newEntries)
        setIsLoading(false)
      },
      onError: () => {
        toast.error("Failed to lookup gender names")
        setEntries([])
        setIsLoading(false)
      },
    })
  }, [step, selectedColumn, data])

  const handleGenderChange = (fullName: string, gender: GenderValue | null) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.fullName === fullName
          ? { ...e, gender, modified: gender !== e.originalGender }
          : e
      )
    )
  }

  const handleBulkSetGender = (gender: GenderValue) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.gender === null ? { ...e, gender, modified: true } : e
      )
    )
  }

  const filteredEntries = React.useMemo(() => {
    if (!filterUnidentified) return entries
    return entries.filter((e) => e.gender === null)
  }, [entries, filterUnidentified])

  const unidentifiedCount = entries.filter((e) => e.gender === null).length
  const hasUnidentified = unidentifiedCount > 0
  const canConfirm = entries.length > 0 && !hasUnidentified

  const handleConfirm = async () => {
    const modifiedEntries = entries.filter((e) => e.modified && e.gender)

    if (modifiedEntries.length === 0) {
      const genderColumn: Record<string, GenderValue> = {}
      for (const entry of entries) {
        if (entry.gender) {
          genderColumn[entry.fullName] = entry.gender
        }
      }
      onConfirm(genderColumn, selectedColumn)
      onOpenChange(false)
      return
    }

    const maleFirstNames = modifiedEntries
      .filter((e) => e.gender === "Male")
      .map((e) => e.firstName)
    const femaleFirstNames = modifiedEntries
      .filter((e) => e.gender === "Female")
      .map((e) => e.firstName)

    setIsLoading(true)

    try {
      if (maleFirstNames.length > 0) {
        await createGenderNames.mutateAsync({
          genderType: "male",
          namesText: maleFirstNames.join("\n"),
          overwrite: true,
        })
      }
      if (femaleFirstNames.length > 0) {
        await createGenderNames.mutateAsync({
          genderType: "female",
          namesText: femaleFirstNames.join("\n"),
          overwrite: true,
        })
      }

      const genderColumn: Record<string, GenderValue> = {}
      for (const entry of entries) {
        if (entry.gender) {
          genderColumn[entry.fullName] = entry.gender
        }
      }

      toast.success("Gender data saved successfully")
      onConfirm(genderColumn, selectedColumn)
      onOpenChange(false)
    } catch {
      toast.error("Failed to save gender data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Gender Column</DialogTitle>
              <DialogDescription>
                Choose the column that contains the names to look up genders
                for.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-sm font-medium">Name Column:</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columnNames.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("assign")}
                disabled={!selectedColumn}
              >
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "assign" && (
          <>
            <DialogHeader>
              <DialogTitle>Assign Genders</DialogTitle>
              <DialogDescription>
                Review and assign genders to the names. All names must have a
                gender before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4">
                {hasUnidentified && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkSetGender("Male")}
                    >
                      Set all to Male
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkSetGender("Female")}
                    >
                      Set all to Female
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filterUnidentified}
                    onChange={(e) => setFilterUnidentified(e.target.checked)}
                    className="rounded"
                  />
                  Show only unidentified ({unidentifiedCount})
                </label>
              </div>

              <div className="flex-1 overflow-auto rounded-md border">
                {isLoading ? (
                  <div className="flex h-40 items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-muted-foreground">
                    No names found in selected column
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="p-2 text-left font-medium">Name</th>
                        <th className="w-40 p-2 text-left font-medium">
                          Gender
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => (
                        <tr key={entry.fullName} className="border-t">
                          <td className="p-2">
                            <span
                              className={
                                entry.modified ? "font-medium text-primary" : ""
                              }
                            >
                              {entry.fullName}
                            </span>
                            {entry.originalGender && entry.modified && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (was {entry.originalGender})
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            <Select
                              value={entry.gender ?? "None"}
                              onValueChange={(v) =>
                                handleGenderChange(
                                  entry.fullName,
                                  v === "None" ? null : (v as GenderValue)
                                )
                              }
                            >
                              <SelectTrigger
                                size="sm"
                                className={`w-full ${
                                  entry.gender === null
                                    ? "border-destructive"
                                    : ""
                                }`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="None">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {hasUnidentified && (
                <p className="text-sm text-destructive">
                  All names must have a gender assigned before confirming.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!canConfirm || isLoading}
              >
                Confirm
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { GenderColumnModal }
