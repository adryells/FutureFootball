import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro no Brasileirão Simulator:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 20, textAlign: 'center', color: 'var(--red)',
          background: 'var(--bg-card)', borderRadius: 8, margin: 10
        }}>
          <h3>⚠️ Algo deu errado</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {this.state.error?.message || 'Erro desconhecido'}
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: 8 }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
