let credentials: { username: string; password: string } | null = null

export function setAuth(user: string, pass: string) {
  credentials = { username: user, password: pass }
}

export function clearAuth() {
  credentials = null
}

export function getAuthHeaders(): Record<string, string> {
  if (!credentials) return {}
  const token = btoa(`${credentials.username}:${credentials.password}`)
  return { Authorization: `Basic ${token}` }
}

export async function apiFetch<T>(
  path: string,
  options?: Omit<RequestInit, 'body'> & { body?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  }

  const res = await fetch(path, {
    ...options,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text || res.statusText}`)
  }

  const contentLength = res.headers.get('content-length')
  const contentType = res.headers.get('content-type') || ''

  if (contentLength === '0' || res.status === 204) {
    return undefined as T
  }

  if (contentType.includes('application/json')) {
    return res.json() as T
  }

  return undefined as T
}
