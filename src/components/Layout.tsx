import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          padding: '0 20px',
          height: 48,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
          Curator
        </span>
        <NavLink href="/queue" current={location.pathname}>Queue</NavLink>
        <NavLink href="/domains" current={location.pathname}>Domains</NavLink>
        <NavLink href="/calibration" current={location.pathname}>Calibration</NavLink>
      </nav>
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}

function NavLink({ href, current, children }: { href: string; current: string; children: ReactNode }) {
  const isActive = current === href
  return (
    <a
      href={href}
      style={{
        color: isActive ? 'var(--text)' : 'var(--text-muted)',
        fontWeight: isActive ? 600 : 400,
        fontSize: 13,
        padding: '2px 0',
        borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      {children}
    </a>
  )
}
