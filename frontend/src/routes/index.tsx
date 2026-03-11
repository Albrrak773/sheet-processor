import * as React from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ValidationResponse } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InputTabs } from "@/components/data-input/input-tabs"
import {
  useUploadAndValidate,
  useValidateFromRaw,
  useValidateFromUrl,
} from "@/lib/queries/validation"
import { db } from "@/db"
import { ColumnMappingModal } from "@/components/validation/column-mapping-modal"
import { createAlias } from "@/lib/api-client"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const validateUrl = useValidateFromUrl()
  const validateRaw = useValidateFromRaw()
  const uploadAndValidate = useUploadAndValidate()

  const [pendingValidation, setPendingValidation] =
    React.useState<ValidationResponse | null>(null)
  const [pendingSource, setPendingSource] = React.useState<{
    type: "google-sheet" | "file-url" | "upload" | "raw"
    label: string
    rawData: string
  } | null>(null)
  const [isMappingSubmitting, setIsMappingSubmitting] = React.useState(false)

  const isLoading =
    validateUrl.isPending ||
    validateRaw.isPending ||
    uploadAndValidate.isPending ||
    isMappingSubmitting

  const error =
    validateUrl.error || validateRaw.error || uploadAndValidate.error

  async function createSessionAndNavigate(
    result: ValidationResponse,
    sourceType: "google-sheet" | "file-url" | "upload" | "raw",
    sourceLabel: string
  ) {
    const sessionId = crypto.randomUUID()

    await db.sessions.add({
      id: sessionId,
      createdAt: new Date(),
      source: { type: sourceType, label: sourceLabel },
      data: result.data,
      validationResult: result,
      modified: false,
    })

    navigate({ to: "/results", search: { sessionId } })
  }

  function handleValidationResult(
    result: ValidationResponse,
    sourceType: "google-sheet" | "file-url" | "upload" | "raw",
    sourceLabel: string,
    rawData: string
  ) {
    if (result.missing_columns.length > 0) {
      setPendingValidation(result)
      setPendingSource({ type: sourceType, label: sourceLabel, rawData })
    } else {
      createSessionAndNavigate(result, sourceType, sourceLabel)
    }
  }

  function handleValidateUrl(url: string) {
    const isGoogleSheet =
      url.includes("docs.google.com/spreadsheets") ||
      url.includes("/spreadsheets/d/")
    const sourceType = isGoogleSheet ? "google-sheet" : "file-url"

    validateUrl.mutate(
      { url },
      {
        onSuccess: (result) =>
          handleValidationResult(result, sourceType, url, ""),
      }
    )
  }

  function handleValidateRaw(data: string) {
    validateRaw.mutate(
      { rawData: data },
      {
        onSuccess: (result) =>
          handleValidationResult(result, "raw", "Pasted data", data),
      }
    )
  }

  function handleValidateFile(file: File) {
    uploadAndValidate.mutate(
      { file },
      {
        onSuccess: (result) =>
          handleValidationResult(result, "upload", file.name, ""),
      }
    )
  }

  async function handleColumnMapping(
    mappings: Map<string, string>,
    ignoredColumns: Array<string>
  ) {
    if (!pendingValidation || !pendingSource) return

    setIsMappingSubmitting(true)
    try {
      for (const [canonicalColumn, inputColumn] of mappings) {
        await createAlias(canonicalColumn, inputColumn)
      }

      const rawData = pendingSource.rawData
      if (rawData) {
        validateRaw.mutate(
          { rawData, ignoreHeaders: ignoredColumns },
          {
            onSuccess: (result) => {
              setPendingValidation(null)
              setPendingSource(null)
              createSessionAndNavigate(
                result,
                pendingSource.type,
                pendingSource.label
              )
            },
            onSettled: () => setIsMappingSubmitting(false),
          }
        )
      } else {
        setPendingValidation(null)
        setPendingSource(null)
        await createSessionAndNavigate(
          { ...pendingValidation, missing_columns: [] },
          pendingSource.type,
          pendingSource.label
        )
        setIsMappingSubmitting(false)
      }
    } catch (error) {
      setIsMappingSubmitting(false)
      console.error("Failed to create aliases:", error)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Sheet Processor</h1>
        <p className="text-sm text-muted-foreground">
          Validate and clean your spreadsheet data
        </p>
      </div>

      <InputTabs
        onValidateUrl={handleValidateUrl}
        onValidateRaw={handleValidateRaw}
        onValidateFile={handleValidateFile}
        isLoading={isLoading}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <ColumnMappingModal
        open={pendingValidation !== null}
        validationResponse={pendingValidation}
        onConfirm={handleColumnMapping}
        isSubmitting={isMappingSubmitting}
      />
    </div>
  )
}
