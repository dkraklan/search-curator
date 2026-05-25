import { apiFetch } from './client'
import type {
  ComponentOverrideRate,
  OutlierPage,
  WeightHistoryEntry,
  SubmitWeightHistoryBody,
} from './types'

export async function fetchComponentOverrideRates(): Promise<ComponentOverrideRate[]> {
  return apiFetch('/internal/calibration/component-override-rates')
}

export async function fetchOutliers(limit = 20): Promise<OutlierPage[]> {
  return apiFetch(`/internal/calibration/outliers?limit=${limit}`)
}

export async function fetchWeightHistory(): Promise<WeightHistoryEntry[]> {
  return apiFetch('/internal/calibration/weight-history')
}

export async function submitWeightHistory(
  body: SubmitWeightHistoryBody
): Promise<WeightHistoryEntry> {
  return apiFetch('/internal/calibration/weight-history', { method: 'POST', body })
}
