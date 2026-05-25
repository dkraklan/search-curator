import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchComponentOverrideRates,
  fetchOutliers,
  fetchWeightHistory,
} from '../api/calibration'
import { LabelBadge } from '../components/LabelBadge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

export default function CalibrationDashboard() {
  const [outlierLimit, setOutlierLimit] = useState(20)

  const { data: overrideRates } = useQuery({
    queryKey: ['calibration', 'override-rates'],
    queryFn: fetchComponentOverrideRates,
  })

  const { data: outliers } = useQuery({
    queryKey: ['calibration', 'outliers', outlierLimit],
    queryFn: () => fetchOutliers(outlierLimit),
  })

  const { data: weightHistory } = useQuery({
    queryKey: ['calibration', 'weight-history'],
    queryFn: fetchWeightHistory,
  })

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>Calibration Dashboard</h2>

      {/* Section 1: Component Override Rates */}
      <section className="card">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Component Override Rates
        </div>
        <div style={{ height: 280 }}>
          {overrideRates && overrideRates.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overrideRates} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis
                  type="category"
                  dataKey="component"
                  width={160}
                  tick={{ fontSize: 12, fill: 'var(--text)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Override Rate']}
                />
                <ReferenceLine x={30} stroke="var(--danger)" strokeDasharray="4 4" />
                <Bar
                  dataKey="override_rate"
                  fill="var(--accent)"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No override data yet.</div>
          )}
        </div>
      </section>

      {/* Section 2: Outliers */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Label Divergence Outliers</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            Limit
            <select
              value={outlierLimit}
              onChange={(e) => setOutlierLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        {outliers && outliers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Rule Score</th>
                <th>Human Label</th>
                <th>Components</th>
              </tr>
            </thead>
            <tbody>
              {outliers.map((o) => (
                <tr key={o.page_id}>
                  <td>
                    <a href={o.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                      {o.url}
                    </a>
                  </td>
                  <td>{o.rule_predicted_score.toFixed(1)}</td>
                  <td>
                    <LabelBadge label={o.human_label} />
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {Object.entries(o.hvs_components)
                      .map(([k, v]) => `${k}: ${Number(v).toFixed(2)}`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No outlier data yet.</div>
        )}
      </section>

      {/* Section 3: Weight History */}
      <section className="card">
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Weight Update History</div>
        {weightHistory && weightHistory.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Applied</th>
                <th>By</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {weightHistory.map((w) => (
                <tr key={w.id}>
                  <td>v{w.version}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(w.applied_at).toLocaleDateString()}
                  </td>
                  <td>{w.applied_by}</td>
                  <td style={{ fontSize: 12 }}>
                    {Object.entries(w.changes)
                      .map(([k, c]) => `${k}: ${c.old.toFixed(2)} → ${c.new.toFixed(2)}`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No weight history yet.</div>
        )}
      </section>
    </div>
  )
}
