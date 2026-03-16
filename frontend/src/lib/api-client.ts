import type {
  Header,
  HeaderAliasRead,
  SessionCreate,
  SessionDetail,
  SessionRead,
  SessionUpdate,
  UploadResponse,
  ValidationResponse,
} from "./types"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

if (!BACKEND_URL) {
  throw new Error("VITE_BACKEND_URL is not set")
}

let getToken: (() => Promise<string | null>) | null = null

export function setAuthGetter(getter: () => Promise<string | null>) {
  getToken = getter
}

async function request<T>(
  path: string,
  init?: RequestInit,
  auth: boolean = false
): Promise<T> {
  const url = `${BACKEND_URL}${path}`
  const headers = new Headers(init?.headers)

  if (auth && getToken) {
    const token = await getToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const res = await fetch(url, { ...init, headers })

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

export async function listSessions(): Promise<Array<SessionRead>> {
  return request<Array<SessionRead>>("/sessions", {}, true)
}

export async function getSession(id: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/sessions/${id}`, {}, true)
}

export async function createSession(
  data: SessionCreate
): Promise<SessionDetail> {
  return request<SessionDetail>(
    "/sessions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  )
}

export async function updateSession(
  id: string,
  data: SessionUpdate
): Promise<SessionDetail> {
  return request<SessionDetail>(
    `/sessions/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  )
}

export async function deleteSession(id: string): Promise<void> {
  await request(
    `/sessions/${id}`,
    {
      method: "DELETE",
    },
    true
  )
}
