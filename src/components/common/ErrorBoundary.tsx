import { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * AppErrorBoundary
 *
 * Top-level React error boundary. Catches rendering errors and shows
 * a recoverable error screen rather than a blank page.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[AERIS] Rendering error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            gap: '1rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg-base)',
          }}
        >
          <div style={{ fontSize: '2rem' }}>⚠</div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
            AERIS encountered an unexpected error
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px', textAlign: 'center' }}>
            {this.state.error?.message ?? 'An unknown rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
