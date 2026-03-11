import * as React from "react"
import type { LinkType } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { detectLinkType, getLinkTypeLabel } from "@/lib/url-detector"

interface LinkInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

function LinkInput({ value, onChange, onSubmit, disabled }: LinkInputProps) {
  const [linkType, setLinkType] = React.useState<LinkType>("unknown")

  React.useEffect(() => {
    const type = detectLinkType(value)
    setLinkType(type)
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && linkType !== "unknown" && value.trim()) {
      e.preventDefault()
      onSubmit()
    }
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="url"
        placeholder="Paste a Google Sheet or file URL..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="font-mono text-sm"
      />
      {hasValue && (
        <div className="flex items-center gap-2">
          <Badge
            variant={linkType === "unknown" ? "destructive" : "secondary"}
            className={cn(
              linkType === "google-sheet" && "border-green-500 text-green-700",
              linkType === "file-url" && "border-blue-500 text-blue-700"
            )}
          >
            {getLinkTypeLabel(linkType)}
          </Badge>
        </div>
      )}
    </div>
  )
}

export { LinkInput }
