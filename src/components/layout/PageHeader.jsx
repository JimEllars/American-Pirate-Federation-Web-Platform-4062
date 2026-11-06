import React from 'react';
import SafeIcon from '../../common/SafeIcon';

/**
 * One page header for every route: kicker, display title, lede, optional actions.
 * Keeping this in one component is what stops each page from inventing its own
 * heading scale (and its own retro costume).
 */
export function PageHeader({ icon, kicker, title, lede, actions, children, className = '' }) {
  return (
    <header className={`mb-10 sm:mb-14 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {icon && <SafeIcon name={icon} className="h-4 w-4 text-apf-purpleLight" />}
            {kicker && <p className="apf-kicker">{kicker}</p>}
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>

      {lede && <p className="apf-lede mt-5 max-w-3xl">{lede}</p>}
      {children}
    </header>
  );
}
