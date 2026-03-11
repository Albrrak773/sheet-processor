import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

interface DraggableColumnProps {
  id: string
  label: string
}

function DraggableColumn({ id, label }: DraggableColumnProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      {label}
    </div>
  )
}

export { DraggableColumn }
