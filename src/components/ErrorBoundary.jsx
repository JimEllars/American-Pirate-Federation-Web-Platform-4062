import React from 'react';
import SafeIcon from '../common/SafeIcon';
import { trackError } from '../lib/api/telemetry';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDiagnostics: false };
    this.clearCacheAndRestart = this.clearCacheAndRestart.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const isChunkLoadError =
      error.name === 'ChunkLoadError' ||
      (error.message && /Failed to fetch dynamically imported module/i.test(error.message));

    if (isChunkLoadError) {
      window.location.reload(true);
      return;
    }

    console.error('[ APF_SYSTEM_FAULT: CRITICAL ERROR BOUNDARY TRIGGERED ]', error, errorInfo);
    trackError(error, errorInfo);
  }

  clearCacheAndRestart() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      const isChunkLoadError =
        this.state.error?.name === 'ChunkLoadError' ||
        (this.state.error?.message && /Failed to fetch dynamically imported module/i.test(this.state.error.message));

      if (isChunkLoadError) {
        return null;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 p-4">
          <div className="apf-card relative w-full max-w-2xl p-8 text-center md:p-12">
            <SafeIcon name="AlertOctagon" className="mx-auto mb-6 h-10 w-10 text-amber-400" />

            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              System Fault
            </h1>

            <div className="mx-auto mb-8 h-px w-24 bg-amber-400/30" />

            <p className="mb-8 text-base leading-relaxed text-ink-muted">
              Interface initialization failed.<br/>
              A core component experienced a fatal exception.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => window.location.reload()}
                className="apf-btn border border-amber-400/40 text-amber-200 hover:bg-amber-400/10"
              >
                Reload Interface
                <SafeIcon name="RefreshCw" className="inline-block ml-3 group-hover:animate-spin h-5 w-5" />
              </button>

              <button
                onClick={this.clearCacheAndRestart}
                className="apf-btn border border-white/[0.12] text-ink-muted hover:border-white/25 hover:text-white"
              >
                Clear Cache & Restart
                <SafeIcon name="Trash2" className="inline-block ml-2 h-4 w-4" />
              </button>
            </div>

            <div className="text-left">
              <button
                onClick={() => this.setState({ showDiagnostics: !this.state.showDiagnostics })}
                className="mb-2 flex items-center text-sm text-ink-dim hover:text-white"
              >
                <SafeIcon name={this.state.showDiagnostics ? 'ChevronDown' : 'ChevronRight'} className="h-4 w-4 mr-1" />
                Diagnostic Details
              </button>

              {this.state.showDiagnostics && (
                <div className="bg-amber-900/20 border border-amber-500/30 p-4 mt-2 overflow-auto max-h-48 text-left">
                  <span className="text-amber-500/80 font-mono text-sm block mb-2">[ ERROR_TRACE ]</span>
                  <code className="text-amber-400/90 font-mono text-xs break-words whitespace-pre-wrap">
                    {this.state.error?.toString() || "Unknown Operational Exception"}
                    {'\n'}
                    {this.state.error?.stack}
                  </code>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
