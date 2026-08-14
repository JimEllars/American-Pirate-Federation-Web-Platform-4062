import React from 'react';
import SafeIcon from '../common/SafeIcon';

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
        <div className="min-h-screen bg-apf-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-vt323 selection:bg-amber-500/30 selection:text-amber-200">
          <div className="scanlines !pointer-events-none" />
          <div className="fixed inset-0 neon-grid opacity-20 !pointer-events-none" />

          <div className="relative z-10 max-w-2xl w-full bg-black/80 backdrop-blur-2xl border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)] p-8 md:p-12 text-center">
            <SafeIcon name="AlertOctagon" className="h-20 w-20 text-amber-500 mx-auto mb-6 animate-pulse" />

            <h1 className="text-4xl md:text-5xl font-black uppercase text-amber-500 tracking-widest mb-4 glitch-hover">
              System Fault
            </h1>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-8" />

            <p className="text-gray-400 text-lg md:text-xl uppercase tracking-widest mb-8 leading-relaxed">
              Interface initialization failed.<br/>
              A core component experienced a fatal exception.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => window.location.reload()}
                className="bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold py-3 px-6 transition-all uppercase tracking-widest text-lg group flex items-center justify-center"
              >
                Reload Interface
                <SafeIcon name="RefreshCw" className="inline-block ml-3 group-hover:animate-spin h-5 w-5" />
              </button>

              <button
                onClick={this.clearCacheAndRestart}
                className="bg-black/50 border border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500 font-bold py-3 px-6 transition-all uppercase tracking-widest text-sm flex items-center justify-center"
              >
                Clear Cache & Restart
                <SafeIcon name="Trash2" className="inline-block ml-2 h-4 w-4" />
              </button>
            </div>

            <div className="text-left">
              <button
                onClick={() => this.setState({ showDiagnostics: !this.state.showDiagnostics })}
                className="text-amber-500/70 hover:text-amber-500 text-sm uppercase tracking-wider mb-2 flex items-center"
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
