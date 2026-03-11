import type {
  Header,
  HeaderAliasRead,
  UploadResponse,
  ValidationResponse,
} from "./types"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

if (!BACKEND_URL) {
  throw new Error("VITE_BACKEND_URL is not set")
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`
  const res = await fetch(url, init)

  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error")
    throw new Error(`API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export async function validateFromUrl(
  dataSource: string,
  ignoreHeaders?: Array<string>
): Promise<ValidationResponse> {
  const params = new URLSearchParams({ data_source: dataSource })
  if (ignoreHeaders) {
    for (const h of ignoreHeaders) {
      params.append("ignore_header", h)
    }
  }
  return request<ValidationResponse>(`/validate?${params.toString()}`, {
    method: "POST",
  })
}

export async function validateFromRaw(
  rawData: string,
  ignoreHeaders?: Array<string>
): Promise<ValidationResponse> {
  const params = new URLSearchParams({ data_source: "raw" })
  if (ignoreHeaders) {
    for (const h of ignoreHeaders) {
      params.append("ignore_header", h)
    }
  }
  return request<ValidationResponse>(`/validate?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: rawData,
  })
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)
  return request<UploadResponse>("/upload", {
    method: "POST",
    body: formData,
  })
}

export async function createAlias(
  header: string,
  newAlias: string
): Promise<HeaderAliasRead> {
  return request<HeaderAliasRead>(
    `/aliases/${encodeURIComponent(header)}/${encodeURIComponent(newAlias)}`,
    {
      method: "POST",
    }
  )
}

export async function fetchHeaders(): Promise<Array<Header>> {
  return request<Array<Header>>("/aliases/headers")
}
