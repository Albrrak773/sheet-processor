import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface MissingColumnsAlertProps {
  columns: Array<string>
  details?: Array<string>
}

function MissingColumnsAlert({ columns, details }: MissingColumnsAlertProps) {
  if (columns.length === 0 && (!details || details.length === 0)) return null

  return (
    <div className="flex flex-col gap-3">
      {columns.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Missing Columns</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap gap-2">
            {columns.map((col) => (
              <Badge key={col} variant="destructive">
                {col}
              </Badge>
            ))}
          </AlertDescription>
        </Alert>
      )}
      {details && details.length > 0 && (
        <Alert>
          <AlertTitle>Details</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc text-sm">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export { MissingColumnsAlert }
