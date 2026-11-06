import React from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/layout/PageTransition';

export function NotFound() {
  return (
    <PageTransition>
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
        <div className="apf-card w-full max-w-xl p-10 text-center">
          <p className="apf-kicker">Error 404</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sector not found
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-muted">
            The requested data node does not exist or has been moved. Check the coordinates
            and try again.
          </p>
          <Link to="/" className="apf-btn apf-btn-primary mt-8">
            Return home
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
