import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchQueue } from '../api/queue'
import { submitLabel } from '../api/labels'
import type { LabelValue, Confidence, QueuePage } from '../api/types'
import { LabelBadge } from '../components/LabelBadge'

const LABEL_KEYS: { key: string; label: LabelValue; name: string }[] = [
  { key: '1', label: 'high_quality', name: 'High Quality' },
  { key: '2', label: 'spam', name: 'Spam' },
  { key: '3', label: 'affiliate_farm', name: 'Affiliate Farm' },
  { key: '4', label: 'ai_farm', name: 'AI Farm' },
  { key: '5', label: 'borderline', name: 'Borderline' },
]

export default function ReviewQueue() {
  const queryClient = useQueryClient()
  const [minHvs, setMinHvs] = useState(30)
  const [maxHvs, setMaxHvs] = useState(60)
  const [unlabeledOnly, setUnlabeledOnly] = useState(true)
  const [selectedLabel, setSelectedLabel] = useState<LabelValue | null>(null)
  const [confidence, setConfidence] = useState<Confidence>('high')
  const [notes, setNotes] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [labelsToday, setLabelsToday] = useState(0)

  const { data: pages, isLoading } = useQuery({
    queryKey: ['queue', minHvs, maxHvs, unlabeledOnly],
    queryFn: () =>
      fetchQueue({ min_hvs: minHvs, max_hvs: maxHvs, limit: 20, unlabeled_only: unlabeledOnly }),
  })

  const page: QueuePage | undefined = pages?.[pageIndex]

  const labelMutation = useMutation({
    mutationFn: submitLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      setLabelsToday((c) => c + 1)
      setSelectedLabel(null)
      setNotes('')
      if (pages && pageIndex < pages.length - 1) {
        setPageIndex((i) => i + 1)
      }
    },
  })

  const handleSubmit = useCallback(() => {
    if (!page || !selectedLabel) return
    labelMutation.mutate({
      page_id: page.id,
      label: selectedLabel,
      confidence,
      notes,
    })
  }, [page, selectedLabel, confidence, notes, labelMutation])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const match = LABEL_KEYS.find((l) => l.key === e.key)
      if (match) {
        setSelectedLabel(match.label)
      } else if (e.key === 'Enter' && selectedLabel) {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedLabel, handleSubmit])

  if (isLoading) return <div style={{ padding: 40 }}>Loading queue…</div>
  if (!pages?.length || !page) return <div style={{ padding: 40 }}>No pages in queue.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Labels today: <strong style={{ color: 'var(--text)' }}>{labelsToday}</strong>
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          Min HVS
          <input
            type="number"
            value={minHvs}
            onChange={(e) => setMinHvs(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          Max HVS
          <input
            type="number"
            value={maxHvs}
            onChange={(e) => setMaxHvs(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={unlabeledOnly}
            onChange={(e) => setUnlabeledOnly(e.target.checked)}
          />
          Unlabeled only
        </label>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: iframe */}
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <a href={page.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
              {page.url}
            </a>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {pageIndex + 1} / {pages.length}
            </span>
          </div>
          <iframe
            src={page.url}
            title={page.title || page.url}
            style={{ flex: 1, width: '100%', border: '1px solid var(--border)', borderRadius: 4 }}
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        </div>

        {/* Right: HVS card */}
        <div
          style={{
            width: 380,
            minWidth: 380,
            padding: 16,
            borderLeft: '1px solid var(--border)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div className="card">
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              HVS: {page.hvs_total.toFixed(1)}
            </div>
            <div style={{ marginTop: 12 }}>
              {Object.entries(page.hvs_components).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    padding: '4px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span>{Number(v).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {page.existing_labels.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Prior labels</div>
              {page.existing_labels.map((l) => (
                <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <LabelBadge label={l.label} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.labeled_by}</span>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Label</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LABEL_KEYS.map(({ key, label, name }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedLabel(label)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    background: selectedLabel === label ? 'var(--accent)' : 'var(--surface)',
                    border: `1px solid ${selectedLabel === label ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                  title={`${key}: ${name}`}
                >
                  {key}: {name}
                </button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              Confidence
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as Confidence)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            <button
              onClick={handleSubmit}
              disabled={!selectedLabel || labelMutation.isPending}
              style={{ marginTop: 4 }}
            >
              {labelMutation.isPending ? 'Submitting…' : 'Submit & Advance'}
            </button>
            {labelMutation.isError && (
              <div style={{ color: 'var(--danger)', fontSize: 12 }}>
                {labelMutation.error.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
