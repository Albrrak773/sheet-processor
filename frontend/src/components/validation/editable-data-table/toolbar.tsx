import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type FilterValue = "all" | "valid" | "invalid"

interface ToolbarProps {
  filter: FilterValue
  onFilterChange: (filter: FilterValue) => void
  searchValue: string
  onSearchChange: (value: string) => void
  totalRows: number
  invalidRowCount: number
}

function Toolbar({
  filter,
  onFilterChange,
  searchValue,
  onSearchChange,
  totalRows,
  invalidRowCount,
}: ToolbarProps) {
  const validCount = totalRows - invalidRowCount

  const filters: Array<{ value: FilterValue; label: string; count: number }> = [
    { value: "all", label: "All", count: totalRows },
    { value: "valid", label: "Valid", count: validCount },
    { value: "invalid", label: "Invalid", count: invalidRowCount },
  ]

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(f.value)}
            className={cn(
              filter === f.value &&
                f.value === "invalid" &&
                "bg-red-600 hover:bg-red-700",
              filter === f.value &&
                f.value === "valid" &&
                "bg-green-600 hover:bg-green-700"
            )}
          >
            {f.label}
            <Badge variant="secondary" className="ml-1.5 px-1.5 text-xs">
              {f.count}
            </Badge>
          </Button>
        ))}
      </div>
      <Input
        placeholder="Search rows..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs text-sm"
      />
    </div>
  )
}

export { Toolbar }
export type { FilterValue }
