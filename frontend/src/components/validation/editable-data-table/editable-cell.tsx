import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface EditableCellProps {
  value: string
  rowIndex: number
  columnId: string
  error?: string
  suggestedValue?: string
  onSave: (rowIndex: number, columnId: string, value: string) => void
}

function EditableCell({
  value,
  rowIndex,
  columnId,
  error,
  suggestedValue,
  onSave,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setEditValue(value)
  }, [value])

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  function handleSubmit() {
    setIsEditing(false)
    if (editValue !== value) {
      onSave(rowIndex, columnId, editValue)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  const hasError = !!error
  const hasSuggestion = !!suggestedValue

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden",
        hasError && "border-l-4 border-l-red-500",
        !hasError && hasSuggestion && "border-l-4 border-l-amber-500"
      )}
    >
      <CellDisplay
        value={value}
        error={error}
        suggestedValue={suggestedValue}
        hasError={hasError}
        hasSuggestion={hasSuggestion}
        onEdit={() => setIsEditing(true)}
      />
      {isEditing && (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 z-10 box-border w-full border-2 border-primary bg-background px-2 text-sm outline-none"
          autoFocus
        />
      )}
    </div>
  )
}

function CellDisplay({
  value,
  error,
  suggestedValue,
  hasError,
  hasSuggestion,
  onEdit,
}: {
  value: string
  error?: string
  suggestedValue?: string
  hasError: boolean
  hasSuggestion: boolean
  onEdit: () => void
}) {
  const content = (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onEdit()
        }
      }}
      className={cn(
        "min-h-7 cursor-pointer px-2 py-1.5 text-sm",
        hasError &&
          "bg-red-100 font-medium text-red-900 dark:bg-red-950/50 dark:text-red-300",
        !hasError &&
          hasSuggestion &&
          "bg-amber-100 font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
      )}
    >
      {value || <span className="text-muted-foreground italic">empty</span>}
    </div>
  )

  if (hasError || hasSuggestion) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top">
          {hasError && <p className="text-red-500">{error}</p>}
          {hasSuggestion && (
            <p className="text-amber-500">Suggested: {suggestedValue}</p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export { EditableCell }
