import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDomains, fetchDomain, updateDomain } from '../api/domains'
import type { DomainDetail } from '../api/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type SortKey = 'domain' | 'seed_tier' | 'hvs_avg' | 'page_count' | 'status'

function compareValues(aVal: unknown, bVal: unknown, desc: boolean): number {
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return desc ? bVal - aVal : aVal - bVal
  }
  const aStr = String(aVal)
  const bStr = String(bVal)
  return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr)
}

export default function DomainReview() {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'hvs_avg', desc: false })
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => fetchDomains({ status: 'active', order_by: 'hvs_avg_asc', limit: 50 }),
  })

  const { data: domainDetail } = useQuery({
    queryKey: ['domain', selectedDomainId],
    queryFn: () => fetchDomain(selectedDomainId!),
    enabled: !!selectedDomainId,
  })

  const sorted = domains
    ? [...domains].sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.desc))
    : []

  if (isLoading) return <div style={{ padding: 40 }}>Loading domains…</div>

  if (selectedDomainId && domainDetail) {
    return (
      <DomainDetailView
        detail={domainDetail}
        onBack={() => setSelectedDomainId(null)}
      />
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 16px' }}>Domains</h2>
      <table>
        <thead>
          <tr>
            <SortHeader label="Domain" sortKey="domain" sort={sort} setSort={setSort} />
            <SortHeader label="Tier" sortKey="seed_tier" sort={sort} setSort={setSort} />
            <SortHeader label="HVS Avg" sortKey="hvs_avg" sort={sort} setSort={setSort} />
            <SortHeader label="Pages" sortKey="page_count" sort={sort} setSort={setSort} />
            <SortHeader label="Status" sortKey="status" sort={sort} setSort={setSort} />
            <th>Last Crawled</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr
              key={d.id}
              onClick={() => setSelectedDomainId(d.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>{d.domain}</td>
              <td>{d.seed_tier}</td>
              <td>{d.hvs_avg?.toFixed(1) ?? '—'}</td>
              <td>{d.page_count}</td>
              <td>
                <span
                  className="badge"
                  style={{
                    background:
                      d.status === 'active'
                        ? 'rgba(80,200,120,0.15)'
                        : d.status === 'blocked'
                          ? 'rgba(224,80,80,0.15)'
                          : 'rgba(139,146,168,0.15)',
                    color:
                      d.status === 'active'
                        ? 'var(--success)'
                        : d.status === 'blocked'
                          ? 'var(--danger)'
                          : 'var(--text-muted)',
                  }}
                >
                  {d.status}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {d.last_crawled_at ? new Date(d.last_crawled_at).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          No domains found.
        </div>
      )}
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  sort,
  setSort,
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; desc: boolean }
  setSort: (s: { key: SortKey; desc: boolean }) => void
}) {
  const active = sort.key === sortKey
  return (
    <th
      onClick={() =>
        setSort({ key: sortKey, desc: active ? !sort.desc : false })
      }
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label} {active ? (sort.desc ? '▼' : '▲') : ''}
    </th>
  )
}

function DomainDetailView({ detail, onBack }: { detail: DomainDetail; onBack: () => void }) {
  const queryClient = useQueryClient()
  const [confirmPromote, setConfirmPromote] = useState(false)

  const mutation = useMutation({
    mutationFn: (body: { status?: string; seed_tier?: number; confirm_promote?: boolean }) =>
      updateDomain(detail.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: ['domain', detail.id] })
      setConfirmPromote(false)
    },
  })

  const histogramData = buildHistogram([...detail.lowest_pages, ...detail.highest_pages])

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to domains
      </button>
      <h2 style={{ margin: '0 0 8px' }}>{detail.domain}</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <span className="card" style={{ fontSize: 13 }}>
          HVS Avg: <strong>{detail.hvs_avg?.toFixed(1) ?? '—'}</strong>
        </span>
        <span className="card" style={{ fontSize: 13 }}>
          Pages: <strong>{detail.page_count}</strong>
        </span>
        <span className="card" style={{ fontSize: 13 }}>
          Tier: <strong>{detail.seed_tier}</strong>
        </span>
        <span className="card" style={{ fontSize: 13 }}>
          Status: <strong>{detail.status}</strong>
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() =>
            mutation.mutate({
              status: detail.status === 'active' ? 'blocked' : 'active',
            })
          }
          disabled={mutation.isPending}
        >
          {detail.status === 'active' ? 'Block Domain' : 'Activate Domain'}
        </button>
        {detail.seed_tier !== 1 && (
          <>
            <button
              onClick={() => setConfirmPromote(true)}
              disabled={mutation.isPending || confirmPromote}
            >
              Promote to Tier 1
            </button>
            {confirmPromote && (
              <button
                style={{ background: 'var(--warning)' }}
                onClick={() => mutation.mutate({ seed_tier: 1, confirm_promote: true })}
                disabled={mutation.isPending}
              >
                Confirm Promotion
              </button>
            )}
          </>
        )}
      </div>

      {/* Histogram */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>HVS Distribution</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData}>
              <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <PageList title="Lowest Scoring Pages" pages={detail.lowest_pages} />
        <PageList title="Highest Scoring Pages" pages={detail.highest_pages} />
      </div>

      {mutation.isError && (
        <div style={{ color: 'var(--danger)', marginTop: 12 }}>
          {mutation.error.message}
        </div>
      )}
    </div>
  )
}

function PageList({ title, pages }: { title: string; pages: { id: string; url: string; hvs_total: number }[] }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 300 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {pages.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
            fontSize: 13,
          }}
        >
          <a href={p.url} target="_blank" rel="noreferrer" style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.url}
          </a>
          <span style={{ color: 'var(--text-muted)' }}>{p.hvs_total.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

function buildHistogram(pages: { hvs_total: number }[]) {
  const bins: Record<string, number> = {}
  const step = 10
  for (let i = 0; i < 100; i += step) {
    bins[`${i}-${i + step}`] = 0
  }
  for (const p of pages) {
    const bucket = Math.floor(p.hvs_total / step) * step
    const key = `${bucket}-${bucket + step}`
    if (bins[key] !== undefined) bins[key]++
  }
  return Object.entries(bins).map(([bin, count]) => ({ bin, count }))
}
