import { useMutation } from "@tanstack/react-query"
import { uploadFile, validateFromRaw, validateFromUrl } from "@/lib/api-client"

export function useValidateFromUrl() {
  return useMutation({
    mutationFn: ({
      url,
      ignoreHeaders,
    }: {
      url: string
      ignoreHeaders?: Array<string>
    }) => validateFromUrl(url, ignoreHeaders),
  })
}

export function useValidateFromRaw() {
  return useMutation({
    mutationFn: ({
      rawData,
      ignoreHeaders,
    }: {
      rawData: string
      ignoreHeaders?: Array<string>
    }) => validateFromRaw(rawData, ignoreHeaders),
  })
}

export function useUploadAndValidate() {
  return useMutation({
    mutationFn: async ({
      file,
      ignoreHeaders,
    }: {
      file: File
      ignoreHeaders?: Array<string>
    }) => {
      const { url } = await uploadFile(file)
      const result = await validateFromUrl(url, ignoreHeaders)
      return result
    },
  })
}
