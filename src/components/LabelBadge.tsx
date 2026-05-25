import type { LabelValue } from '../api/types'

const LABEL_CLASSES: Record<LabelValue, string> = {
  high_quality: 'badge-high',
  spam: 'badge-spam',
  affiliate_farm: 'badge-affiliate',
  ai_farm: 'badge-ai',
  borderline: 'badge-borderline',
  needs_context: 'badge-needs',
}

const LABEL_NAMES: Record<LabelValue, string> = {
  high_quality: 'High Quality',
  spam: 'Spam',
  affiliate_farm: 'Affiliate Farm',
  ai_farm: 'AI Farm',
  borderline: 'Borderline',
  needs_context: 'Needs Context',
}

export function LabelBadge({ label }: { label: LabelValue }) {
  return <span className={`badge ${LABEL_CLASSES[label]}`}>{LABEL_NAMES[label]}</span>
}

export function LabelName({ label }: { label: LabelValue }) {
  return <span>{LABEL_NAMES[label]}</span>
}
