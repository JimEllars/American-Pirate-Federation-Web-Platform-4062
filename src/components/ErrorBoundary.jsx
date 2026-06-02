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

          <div className="relative z-10 max-w-2xl w-full bg-black/60 backdrop-blur-2xl border border-red-500/30 shadow-[0_0_50px_rgba(255,0,0,0.1)] p-8 md:p-12 text-center">
            <SafeIcon name="AlertTriangle" className="h-24 w-24 text-red-500 mx-auto mb-6 animate-pulse" />

            <h1 className="text-4xl md:text-5xl font-black uppercase text-red-500 tracking-widest mb-4 glitch-hover">
              Signal Interrupted
            </h1>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent mb-8" />

            <p className="text-gray-400 text-lg md:text-xl uppercase tracking-widest mb-8 leading-relaxed">
              Critical state mutation failure detected.<br/>
              The node encountered an unexpected anomaly during execution.
            </p>

            <div className="bg-red-500/10 border border-red-500/20 p-4 mb-8 text-left overflow-hidden">
               <span className="text-red-400 font-mono text-sm block mb-2">[ERROR_TRACE]</span>
               <code className="text-red-300 font-mono text-xs break-all">
                 {this.state.error?.toString() || "Unknown Operational Exception"}
               </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold py-3 px-8 transition-all uppercase tracking-widest text-lg group"
            >
              Re-establish Connection
              <SafeIcon name="RefreshCw" className="inline-block ml-2 group-hover:animate-spin" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
