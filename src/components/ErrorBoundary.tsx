import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 40,
        }}
      >
        <h2 style={{ margin: 0 }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 480, textAlign: 'center' }}>
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    )
  }
}
