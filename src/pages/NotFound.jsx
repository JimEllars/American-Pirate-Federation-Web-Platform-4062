import React from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/layout/PageTransition';

export function NotFound() {
  return (
    <PageTransition>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-black/40 backdrop-blur-md border border-red-900/50 shadow-2xl p-12 text-center max-w-2xl w-full">
          <h1 className="text-4xl md:text-5xl font-vt323 text-red-500 animate-pulse mb-6 uppercase tracking-widest">
            [ 404: SECTOR NOT FOUND // NAVIGATIONAL COORDINATES CORRUPTED ]
          </h1>
          <p className="text-gray-400 font-vt323 text-xl mb-8 uppercase tracking-wider">
            Warning: The requested data node does not exist or has been redacted by the APF High Command.
          </p>
          <Link
            to="/"
            className="inline-block border border-red-500/50 text-red-500 hover:bg-red-500/10 px-8 py-3 font-vt323 text-xl tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            [ INITIATE RETURN TO HOME SECTOR ]
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
