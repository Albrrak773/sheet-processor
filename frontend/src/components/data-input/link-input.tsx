import * as React from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { detectLinkType } from "@/lib/url-detector"
import { validateFromUrl } from "@/lib/api-client"

type BadgeState =
  | { type: "empty" }
  | { type: "checking" }
  | { type: "file-url" }
  | { type: "google-sheet-accessible" }
  | { type: "google-sheet-restricted"; message: string }
  | { type: "google-sheet-published-accessible" }
  | { type: "google-sheet-published-restricted"; message: string }
  | { type: "unknown" }

interface LinkInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  onRestrictedChange?: (isRestricted: boolean) => void
}

function LinkInput({
  value,
  onChange,
  onSubmit,
  disabled,
  onRestrictedChange,
}: LinkInputProps) {
  const [badgeState, setBadgeState] = React.useState<BadgeState>({ type: "empty" })

  React.useEffect(() => {
    if (!value.trim()) {
      setBadgeState({ type: "empty" })
      onRestrictedChange?.(false)
      return
    }

    setBadgeState({ type: "checking" })

    let cancelled = false

    const timeoutId = setTimeout(async () => {
      if (cancelled) return

      const linkType = detectLinkType(value)

      if (linkType === "unknown") {
        setBadgeState({ type: "unknown" })
        onRestrictedChange?.(false)
        return
      }

      if (linkType === "file-url") {
        setBadgeState({ type: "file-url" })
        onRestrictedChange?.(false)
        return
      }

      const isPublished = linkType === "google-sheet-published"
      const accessibleState = isPublished ? "google-sheet-published-accessible" : "google-sheet-accessible"
      const restrictedState = isPublished ? "google-sheet-published-restricted" : "google-sheet-restricted"

      try {
        await validateFromUrl(value)
        setBadgeState({ type: accessibleState })
        onRestrictedChange?.(false)
      } catch (error) {
        if (error instanceof Error && error.message.includes("400")) {
          const match = error.message.match(/\{.*\}/s)
          const detail = match ? JSON.parse(match[0]).detail : "Unknown error"
          setBadgeState({ type: restrictedState, message: detail } as BadgeState)
          onRestrictedChange?.(true)
        } else {
          setBadgeState({ type: accessibleState })
          onRestrictedChange?.(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [value, onRestrictedChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (
      e.key === "Enter" &&
      badgeState.type !== "unknown" &&
      badgeState.type !== "empty" &&
      badgeState.type !== "google-sheet-restricted" &&
      badgeState.type !== "google-sheet-published-restricted"
    ) {
      e.preventDefault()
      onSubmit()
    }
  }

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
      {badgeState.type !== "empty" && (
        <div className="flex items-center gap-2">
          {badgeState.type === "checking" && (
            <Badge variant="secondary" className="border-gray-400 text-gray-600">
              Checking...
            </Badge>
          )}
          {badgeState.type === "file-url" && (
            <Badge
              variant="secondary"
              className="border-blue-500 text-blue-700"
            >
              File URL
            </Badge>
          )}
          {badgeState.type === "google-sheet-accessible" && (
            <Badge
              variant="secondary"
              className="border-green-500 text-green-700"
            >
              Google Sheet
            </Badge>
          )}
          {badgeState.type === "google-sheet-restricted" && (
            <Badge variant="destructive">{badgeState.message}</Badge>
          )}
          {badgeState.type === "google-sheet-published-accessible" && (
            <Badge
              variant="secondary"
              className="border-green-500 text-green-700"
            >
              Published Google Sheet
            </Badge>
          )}
          {badgeState.type === "google-sheet-published-restricted" && (
            <Badge variant="destructive">{badgeState.message}</Badge>
          )}
          {badgeState.type === "unknown" && (
            <Badge variant="destructive">Invalid URL</Badge>
          )}
        </div>
      )}
    </div>
  )
}

export { LinkInput }
