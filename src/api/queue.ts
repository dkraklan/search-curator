import { apiFetch } from './client'
import type { QueuePage, QueueParams } from './types'

export async function fetchQueue(params?: QueueParams): Promise<QueuePage[]> {
  const search = new URLSearchParams()
  if (params?.min_hvs !== undefined) search.set('min_hvs', String(params.min_hvs))
  if (params?.max_hvs !== undefined) search.set('max_hvs', String(params.max_hvs))
  if (params?.limit !== undefined) search.set('limit', String(params.limit))
  if (params?.unlabeled_only !== undefined) search.set('unlabeled_only', String(params.unlabeled_only))

  const qs = search.toString()
  return apiFetch(`/internal/queue${qs ? `?${qs}` : ''}`)
}

export async function fetchQueuePage(pageId: string): Promise<QueuePage> {
  return apiFetch(`/internal/queue/${pageId}`)
}
