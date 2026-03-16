import { useDroppable } from "@dnd-kit/core"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface DropZoneProps {
  id: string
  label: string
  mappedColumn?: string
  onRemove: () => void
  isOptional?: boolean
  isIgnored?: boolean
  onToggleIgnore: () => void
}

function DropZone({
  id,
  label,
  mappedColumn,
  onRemove,
  isOptional,
  isIgnored,
  onToggleIgnore,
}: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[44px] items-center justify-between gap-3 rounded-md border-2 border-dashed px-4 py-2.5 transition-colors",
        isOver && "border-primary bg-primary/10",
        mappedColumn &&
          "border-solid border-green-500 bg-green-50 dark:bg-green-950",
        isIgnored && "border-dashed border-muted-foreground/30 bg-muted/50"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-sm font-medium",
            isIgnored && "text-muted-foreground line-through"
          )}
        >
          {label}
        </span>
        {isOptional && !mappedColumn && !isIgnored && (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            optional
          </span>
        )}
        {mappedColumn && (
          <span className="text-sm text-muted-foreground">
            ← {mappedColumn}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {mappedColumn && (
          <button
            onClick={onRemove}
            className="rounded p-1 hover:bg-muted"
            type="button"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="h-4 w-4"
            />
          </button>
        )}
        {!mappedColumn && (
          <button
            onClick={onToggleIgnore}
            className={cn(
              "rounded px-2 py-1 text-xs hover:bg-muted",
              isIgnored
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            {isIgnored ? "Restore" : "Ignore"}
          </button>
        )}
      </div>
    </div>
  )
}

export { DropZone }
