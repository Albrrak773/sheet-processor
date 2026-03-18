import type { UnmappedGender } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MissingColumnsAlertProps {
  columns: Array<string>
  details?: Array<string>
  onCreateGenderColumn?: () => void
  unmappedGenders?: Array<UnmappedGender>
  onMapGenders?: () => void
}

function MissingColumnsAlert({
  columns,
  details,
  onCreateGenderColumn,
  unmappedGenders,
  onMapGenders,
}: MissingColumnsAlertProps) {
  if (
    columns.length === 0 &&
    (!details || details.length === 0) &&
    (!unmappedGenders || unmappedGenders.length === 0)
  )
    return null

  const hasGenderMissing = columns.includes("gender")
  const hasUnmappedGenders = unmappedGenders && unmappedGenders.length > 0

  return (
    <div className="flex flex-col gap-3">
      {columns.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Missing Columns</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center gap-2">
            {columns.map((col) => (
              <Badge key={col} variant="destructive">
                {col}
              </Badge>
            ))}
            {hasGenderMissing && onCreateGenderColumn && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateGenderColumn}
                className="ml-2"
              >
                Create Gender Column
              </Button>
            )}
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
      {hasUnmappedGenders && (
        <Alert variant="destructive">
          <AlertTitle>Invalid Gender Values</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center gap-2">
            {unmappedGenders.map((gender) => (
              <Badge key={gender.value} variant="destructive">
                {gender.value} ({gender.count})
              </Badge>
            ))}
            {onMapGenders && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMapGenders}
                className="ml-2"
              >
                Map Values
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export { MissingColumnsAlert }
