import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface EditableCellProps {
  value: string
  rowNum: number
  columnId: string
  error?: string
  suggestedValue?: string
  onSave: (rowNum: number, columnId: string, value: string) => void
}

function EditableCell({
  value,
  rowNum,
  columnId,
  error,
  suggestedValue,
  onSave,
}: EditableCellProps) {
  const [isSelected, setIsSelected] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)
  const containerRef = React.useRef<HTMLDivElement>(null)
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

  React.useEffect(() => {
    if (isSelected && !isEditing) {
      function handleClickOutside(e: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsSelected(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSelected, isEditing])

  function handleSelect() {
    if (!isSelected) {
      setIsSelected(true)
    }
  }

  function handleDoubleClick() {
    setIsEditing(true)
  }

  function handleSubmit() {
    setIsEditing(false)
    setIsSelected(false)
    if (editValue !== value) {
      onSave(rowNum, columnId, editValue)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (isSelected && !isEditing) {
        setIsEditing(true)
      } else if (isEditing) {
        handleSubmit()
      }
    }
    if (e.key === "Escape") {
      if (isEditing) {
        setEditValue(value)
        setIsEditing(false)
      }
      setIsSelected(false)
    }
  }

  const hasError = !!error
  const hasSuggestion = !!suggestedValue

  return (
    <div
      ref={containerRef}
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
        isSelected={isSelected}
        isEditing={isEditing}
        onSelect={handleSelect}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
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
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  onKeyDown,
}: {
  value: string
  error?: string
  suggestedValue?: string
  hasError: boolean
  hasSuggestion: boolean
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onDoubleClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const content = (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      className={cn(
        "min-h-7 cursor-pointer px-2 py-1.5 text-sm outline-none",
        isSelected && !isEditing && "ring-2 ring-primary ring-inset",
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
