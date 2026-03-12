import * as React from "react"
import { cn } from "@/lib/utils"

interface FileUploadInputProps {
  file: File | null
  onFileSelect: (file: File) => void
  disabled?: boolean
}

function FileUploadInput({
  file,
  onFileSelect,
  disabled,
}: FileUploadInputProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    const droppedFile = e.dataTransfer.files[0]
    onFileSelect(droppedFile)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  function handleClick() {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        {file ? (
          <>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-muted-foreground">
              Click or drop to replace
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">
              Drop a file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports .csv, .tsv, .xlsx, .xls
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export { FileUploadInput }
