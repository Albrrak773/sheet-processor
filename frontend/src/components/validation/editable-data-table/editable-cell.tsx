import * as React from "react"
import { Input } from "@/components/ui/input"
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

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className="h-7 rounded-none border-primary text-sm"
      />
    )
  }

  const cellContent = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setIsEditing(true)
        }
      }}
      className={cn(
        "cursor-pointer px-2 py-1.5 text-sm",
        hasError &&
          "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-300",
        !hasError &&
          hasSuggestion &&
          "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
      )}
    >
      {value || <span className="text-muted-foreground italic">empty</span>}
    </div>
  )

  if (hasError || hasSuggestion) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
        <TooltipContent>
          {hasError && <p className="text-red-500">{error}</p>}
          {hasSuggestion && (
            <p className="text-amber-500">
              Suggested: {String(suggestedValue)}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return cellContent
}

export { EditableCell }
