import React from 'react';
import SafeIcon from '../common/SafeIcon';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('APF System Integrity Failure:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-apf-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-vt323 selection:bg-apf-purple selection:text-white">
          <div className="scanlines !pointer-events-none" />
          <div className="fixed inset-0 neon-grid opacity-20 !pointer-events-none" />

          <div className="relative z-10 max-w-2xl w-full bg-black backdrop-blur-md border border-apf-emerald shadow-[0_0_50px_rgba(16,185,129,0.1)] p-8 md:p-12 text-center">
            <SafeIcon name="AlertTriangle" className="h-24 w-24 text-apf-emerald mx-auto mb-6 animate-pulse" />

            <h1 className="text-2xl md:text-3xl font-black uppercase font-mono text-apf-emerald tracking-widest mb-4 glitch-hover">
              [ SYSTEM EXCEPTION CAPTURED: PROTOCOL SAFE-MODE DEPLOYED ]
            </h1>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-apf-emerald/50 to-transparent mb-8" />

            <p className="text-gray-400 text-lg md:text-xl uppercase tracking-widest mb-8 leading-relaxed">
              Critical state mutation failure detected.<br/>
              The node encountered an unexpected anomaly during execution.
            </p>

            <div className="bg-apf-emerald/10 border border-apf-emerald/20 p-4 mb-8 text-left overflow-hidden">
               <span className="text-apf-emerald font-mono text-sm block mb-2">[ERROR_TRACE]</span>
               <code className="text-gray-300 font-mono text-xs break-all">
                 {this.state.error?.toString() || "Unknown Operational Exception"}
               </code>
            </div>

            <button
              onClick={() => { sessionStorage.clear(); window.location.reload(); }}
              className="bg-transparent border border-apf-emerald text-apf-emerald hover:bg-apf-emerald hover:text-black font-bold py-3 px-8 transition-all uppercase tracking-widest text-lg group"
            >
              Attempt Core Re-Sync
              <SafeIcon name="RefreshCw" className="inline-block ml-2 group-hover:animate-spin" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
