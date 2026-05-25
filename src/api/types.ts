// ─── Review Queue ────────────────────────────────────────────────────────────

export interface QueuePage {
  id: string
  url: string
  title: string
  hvs_total: number
  hvs_components: Record<string, number>
  raw_signals: Record<string, unknown>
  existing_labels: LabelRecord[]
}

export interface QueueParams {
  min_hvs?: number
  max_hvs?: number
  limit?: number
  unlabeled_only?: boolean
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export type LabelValue =
  | 'high_quality'
  | 'spam'
  | 'affiliate_farm'
  | 'ai_farm'
  | 'borderline'
  | 'needs_context'

export type Confidence = 'high' | 'medium' | 'low'

export interface LabelRecord {
  id: string
  page_id: string
  label: LabelValue
  confidence: Confidence
  notes: string | null
  labeled_by: string
  created_at: string
}

export interface SubmitLabelBody {
  page_id: string
  label: LabelValue
  confidence: Confidence
  notes?: string
}

// ─── Domains ─────────────────────────────────────────────────────────────────

export interface Domain {
  id: string
  domain: string
  seed_tier: number
  hvs_avg: number | null
  page_count: number
  publish_velocity: number | null
  status: string
  last_crawled_at: string | null
}

export interface DomainDetail extends Domain {
  lowest_pages: QueuePage[]
  highest_pages: QueuePage[]
}

export interface UpdateDomainBody {
  status?: string
  seed_tier?: number
  confirm_promote?: boolean
}

// ─── Calibration ─────────────────────────────────────────────────────────────

export interface ComponentOverrideRate {
  component: string
  override_rate: number
  total_labels: number
}

export interface OutlierPage {
  page_id: string
  url: string
  rule_predicted_score: number
  human_label: LabelValue
  hvs_components: Record<string, number>
}

export interface WeightHistoryEntry {
  id: string
  version: number
  changes: Record<string, { old: number; new: number }>
  applied_by: string
  applied_at: string
}

export interface SubmitWeightHistoryBody {
  version: number
  changes: Record<string, { old: number; new: number }>
}
