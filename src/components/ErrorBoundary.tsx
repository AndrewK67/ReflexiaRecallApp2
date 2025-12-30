import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-screen w-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center">
                <AlertTriangle size={40} className="text-red-400" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>

              {/* Description */}
              <p className="text-white/70 text-sm mb-6">
                We encountered an unexpected error. Your data is safe, but you may need to refresh the app.
              </p>

              {/* Error Details (in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-black/30 rounded-xl text-left">
                  <p className="text-xs font-mono text-red-300 mb-2">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-white/60">
                      <summary className="cursor-pointer hover:text-white/80">Stack trace</summary>
                      <pre className="mt-2 overflow-auto max-h-32 text-[10px]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition active:scale-95"
                >
                  <Home size={20} />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold transition active:scale-95"
                >
                  <RefreshCw size={20} />
                  Reload App
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-xs text-white/50">
                If this persists, try clearing your browser cache or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
