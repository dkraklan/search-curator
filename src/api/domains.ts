import { apiFetch } from './client'
import type { Domain, DomainDetail, UpdateDomainBody } from './types'

export interface DomainListParams {
  status?: string
  order_by?: string
  limit?: number
}

export async function fetchDomains(params?: DomainListParams): Promise<Domain[]> {
  const search = new URLSearchParams()
  if (params?.status) search.set('status', params.status)
  if (params?.order_by) search.set('order_by', params.order_by)
  if (params?.limit !== undefined) search.set('limit', String(params.limit))

  const qs = search.toString()
  return apiFetch(`/internal/domains${qs ? `?${qs}` : ''}`)
}

export async function fetchDomain(domainId: string): Promise<DomainDetail> {
  return apiFetch(`/internal/domains/${domainId}`)
}

export async function updateDomain(
  domainId: string,
  body: UpdateDomainBody
): Promise<Domain> {
  return apiFetch(`/internal/domains/${domainId}`, { method: 'PUT', body })
}
