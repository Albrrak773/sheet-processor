import { useMutation } from "@tanstack/react-query"
import { createGenderNames, lookupGenderNames } from "@/lib/api-client"

export function useGenderLookup() {
  return useMutation({
    mutationFn: (namesText: string) => lookupGenderNames(namesText),
  })
}

export function useCreateGenderNames() {
  return useMutation({
    mutationFn: ({
      genderType,
      namesText,
      overwrite = false,
    }: {
      genderType: string
      namesText: string
      overwrite?: boolean
    }) => createGenderNames(genderType, namesText, overwrite),
  })
}
