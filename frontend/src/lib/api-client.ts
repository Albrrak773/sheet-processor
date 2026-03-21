import { sanitizeUrl } from "./utils"
import type {
  GenderAliasRead,
  GenderLookupResult,
  GenderValue,
  Header,
  HeaderAliasRead,
  MemberLookupRequest,
  MemberRead,
  NameBatchResponse,
  NameRead,
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

  // Handle 204 No Content responses
  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export async function validateFromUrl(
  dataSource: string,
  ignoreHeaders?: Array<string>
): Promise<ValidationResponse> {
  const params = new URLSearchParams({ data_source: sanitizeUrl(dataSource) })
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
    },
    true
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

export async function lookupGenderNames(
  namesText: string
): Promise<Array<GenderLookupResult>> {
  return request<Array<GenderLookupResult>>("/genders/lookup", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: namesText,
  })
}

export async function createGenderNames(
  genderType: string,
  namesText: string,
  overwrite: boolean = false
): Promise<NameBatchResponse> {
  const params = new URLSearchParams()
  if (overwrite) {
    params.set("overwrite", "true")
  }
  return request<NameBatchResponse>(
    `/genders/${genderType}/?${params.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: namesText,
    }
  )
}

export async function createGenderAlias(
  gender: GenderValue,
  alias: string
): Promise<void> {
  const endpoint = `/genders/${gender.toLowerCase()}/${encodeURIComponent(alias)}`
  await request(endpoint, { method: "POST" }, true)
}

// Header Aliases
export async function listHeaderAliases(): Promise<Array<HeaderAliasRead>> {
  return request<Array<HeaderAliasRead>>("/aliases/")
}

export async function deleteHeaderAlias(aliasId: number): Promise<void> {
  await request(`/aliases/${aliasId}`, { method: "DELETE" }, true)
}

export async function updateHeaderAlias(
  aliasId: number,
  aliasName: string
): Promise<HeaderAliasRead> {
  return request<HeaderAliasRead>(
    `/aliases/${aliasId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias_name: aliasName }),
    },
    true
  )
}

// Gender Aliases
export async function listGenderAliases(): Promise<Array<GenderAliasRead>> {
  return request<Array<GenderAliasRead>>("/genders")
}

export async function deleteGenderAlias(aliasId: number): Promise<void> {
  await request(`/genders/${aliasId}`, { method: "DELETE" }, true)
}

export async function updateGenderAlias(
  aliasId: number,
  alias: string
): Promise<GenderAliasRead> {
  return request<GenderAliasRead>(
    `/genders/${aliasId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias }),
    },
    true
  )
}

// Names
export async function listNames(): Promise<Array<NameRead>> {
  return request<Array<NameRead>>("/genders/names")
}

export async function updateNameGender(
  nameId: number,
  gender: GenderValue
): Promise<NameRead> {
  return request<NameRead>(
    `/genders/names/${nameId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender }),
    },
    true
  )
}

// Members
export async function listMembers(): Promise<Array<MemberRead>> {
  return request<Array<MemberRead>>("/uni-id", {}, true)
}

export async function lookupMembers(
  params: MemberLookupRequest
): Promise<Array<MemberRead>> {
  return request<Array<MemberRead>>(
    "/uni-id/lookup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    true
  )
}
