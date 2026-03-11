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

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const validateUrl = useValidateFromUrl()
  const validateRaw = useValidateFromRaw()
  const uploadAndValidate = useUploadAndValidate()

  const isLoading =
    validateUrl.isPending ||
    validateRaw.isPending ||
    uploadAndValidate.isPending

  const error =
    validateUrl.error || validateRaw.error || uploadAndValidate.error

  async function handleSuccess(
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

  function handleValidateUrl(url: string) {
    const isGoogleSheet =
      url.includes("docs.google.com/spreadsheets") ||
      url.includes("/spreadsheets/d/")
    const sourceType = isGoogleSheet ? "google-sheet" : "file-url"

    validateUrl.mutate(
      { url },
      {
        onSuccess: (result) => handleSuccess(result, sourceType, url),
      }
    )
  }

  function handleValidateRaw(data: string) {
    validateRaw.mutate(
      { rawData: data },
      {
        onSuccess: (result) => handleSuccess(result, "raw", "Pasted data"),
      }
    )
  }

  function handleValidateFile(file: File) {
    uploadAndValidate.mutate(
      { file },
      {
        onSuccess: (result) => handleSuccess(result, "upload", file.name),
      }
    )
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
    </div>
  )
}
