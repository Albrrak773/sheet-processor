import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/tanstack-react-start"

import type { ValidationResponse } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InputTabs } from "@/components/data-input/input-tabs"
import {
  useUploadAndValidate,
  useValidateFromRaw,
  useValidateFromUrl,
} from "@/lib/queries/validation"
import { ColumnMappingModal } from "@/components/validation/column-mapping-modal"
import { createAlias, createSession } from "@/lib/api-client"

function DataInput() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isSignedIn } = useAuth()
  const validateUrl = useValidateFromUrl()
  const validateRaw = useValidateFromRaw()
  const uploadAndValidate = useUploadAndValidate()

  const [pendingValidation, setPendingValidation] =
    React.useState<ValidationResponse | null>(null)
  const [pendingSource, setPendingSource] = React.useState<{
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
    rawData: string
  ) {
    const session = await createSession({
      original_csv: result.raw_csv || rawData,
      data: result.data,
    })

    queryClient.invalidateQueries({ queryKey: ["sessions"] })
    navigate({ to: "/sessions/$id", params: { id: session.id } })
  }

  function navigateToGuest(result: ValidationResponse) {
    const key = `guest_validation_${Date.now()}`
    sessionStorage.setItem(key, JSON.stringify(result))
    navigate({ to: "/guest", search: { key } })
  }

  function handleValidationResult(result: ValidationResponse, rawData: string) {
    if (result.missing_columns.length > 0) {
      setPendingValidation(result)
      setPendingSource({ rawData })
    } else if (isSignedIn) {
      createSessionAndNavigate(result, rawData)
    } else {
      navigateToGuest(result)
    }
  }

  function handleValidateUrl(url: string) {
    validateUrl.mutate(
      { url },
      {
        onSuccess: (result) => handleValidationResult(result, result.raw_csv),
      }
    )
  }

  function handleValidateRaw(data: string) {
    validateRaw.mutate(
      { rawData: data },
      {
        onSuccess: (result) => handleValidationResult(result, data),
      }
    )
  }

  function handleValidateFile(file: File) {
    uploadAndValidate.mutate(
      { file },
      {
        onSuccess: (result) => handleValidationResult(result, result.raw_csv),
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
              if (isSignedIn) {
                createSessionAndNavigate(result, rawData)
              } else {
                navigateToGuest(result)
              }
            },
            onSettled: () => setIsMappingSubmitting(false),
          }
        )
      } else {
        setPendingValidation(null)
        setPendingSource(null)
        if (isSignedIn) {
          await createSessionAndNavigate(
            { ...pendingValidation, missing_columns: [] },
            ""
          )
        } else {
          navigateToGuest({ ...pendingValidation, missing_columns: [] })
        }
        setIsMappingSubmitting(false)
      }
    } catch (err) {
      setIsMappingSubmitting(false)
      console.error("Failed to create aliases:", err)
    }
  }

  function handleCancelMapping() {
    setPendingValidation(null)
    setPendingSource(null)
  }

  return (
    <>
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
        onCancel={handleCancelMapping}
        isSubmitting={isMappingSubmitting}
      />
    </>
  )
}

export { DataInput }
