import type { ValidationResponse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  result: ValidationResponse
}

function SummaryCards({ result }: SummaryCardsProps) {
  const invalidCount = new Set(result.invalid_rows.map((r) => r.row)).size
  const validCount = result.total_rows - invalidCount

  const cards = [
    {
      title: "Total Rows",
      value: result.total_rows,
      className: "",
    },
    {
      title: "Valid",
      value: validCount,
      className: "text-green-600",
    },
    {
      title: "Invalid",
      value: invalidCount,
      className: invalidCount > 0 ? "text-red-600" : "",
    },
    {
      title: "Missing Columns",
      value: result.missing_columns.length,
      className: result.missing_columns.length > 0 ? "text-amber-600" : "",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
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
