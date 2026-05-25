import { useState } from 'react'
import { setAuth, clearAuth, apiFetch } from '../api/client'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  if (authed) return <>{children}</>

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Both fields required')
      return
    }
    setAuth(username, password)
    setChecking(true)
    setError('')
    try {
      await apiFetch('/internal/queue?limit=0')
      setAuthed(true)
    } catch (err) {
      clearAuth()
      setError('Invalid credentials')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={handle}
        className="card"
        style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Curator Login</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}
        <button type="submit" disabled={checking}>
          {checking ? 'Checking…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
