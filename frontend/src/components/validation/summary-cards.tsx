import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Delete02Icon,
  GitMergeIcon,
  LayoutTopIcon,
  ListViewIcon,
} from "@hugeicons/core-free-icons"
import type { ValidationResponse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  result: ValidationResponse
}

function SummaryCards({ result }: SummaryCardsProps) {
  const invalidCount = new Set(result.invalid_rows.map((r) => r.row)).size
  const validCount = result.total_rows - invalidCount
  const duplicateCount = new Set(
    result.duplicate_rows.flatMap((d) => d.duplicate_rows)
  ).size

  const cards = [
    {
      title: "Total Rows",
      value: result.total_rows,
      className: "",
      icon: ListViewIcon,
    },
    {
      title: "Valid",
      value: validCount,
      className: "text-green-600",
      icon: CheckmarkCircle02Icon,
    },
    {
      title: "Invalid",
      value: invalidCount,
      className: invalidCount > 0 ? "text-red-600" : "",
      icon: Delete02Icon,
    },
    {
      title: "Duplicates",
      value: duplicateCount,
      className: duplicateCount > 0 ? "text-purple-600" : "",
      icon: GitMergeIcon,
    },
    {
      title: "Missing Columns",
      value: result.missing_columns.length,
      className: result.missing_columns.length > 0 ? "text-amber-600" : "",
      icon: LayoutTopIcon,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HugeiconsIcon icon={card.icon} strokeWidth={2} />
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-bold", card.className)}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { SummaryCards }
