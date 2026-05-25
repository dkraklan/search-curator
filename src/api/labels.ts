import { apiFetch } from './client'
import type { LabelRecord, SubmitLabelBody } from './types'

export async function submitLabel(body: SubmitLabelBody): Promise<LabelRecord> {
  return apiFetch('/internal/labels', { method: 'POST', body })
}

export async function fetchLabels(pageId: string): Promise<LabelRecord[]> {
  return apiFetch(`/internal/labels/${pageId}`)
}
