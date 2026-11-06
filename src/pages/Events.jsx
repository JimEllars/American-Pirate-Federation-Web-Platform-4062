import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/seo/SEO';
import { FleetMuster } from '../components/sections/FleetMuster';
import SafeIcon from '../common/SafeIcon';
import { useAXiMHydration } from '../hooks/useAXiMHydration';


export function Events() {
  const [eventsData, setEventsData] = useState([]);
  const { fetchActiveEvents, loading } = useAXiMHydration();

  React.useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      const data = await fetchActiveEvents();
      if (isMounted) {
        // Law 1: when the events table is empty we render an empty state.
        // We never substitute invented musters.
        setEventsData(Array.isArray(data) ? data : []);
      }
    };
    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [fetchActiveEvents]);


  return (
    <Layout>
      <SEO title="Events | Fleet Muster" description="Upcoming gatherings and synchronization points for the American Pirate Federation." />
      <PageTransition>
        <div className="apf-container py-14 sm:py-20">
          <PageHeader
            icon="Target"
            kicker="Calendar"
            title="Fleet Muster"
            lede="Physical and digital convergence points for the Federation. Presence is participation."
          />
          <div className="apf-card overflow-hidden">
            {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-muted">
                    <SafeIcon name="Loader" className="h-4 w-4 animate-spin text-apf-purpleLight" />
                    Loading musters…
                </div>
            ) : (
                eventsData.length === 0 ? (
                <div className="px-6 py-16 text-center">
                    <p className="text-base font-medium text-white">No musters scheduled</p>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                      No active fleet gatherings are on the calendar. Sign in with a Pirate
                      Passport to receive dispatch notices when one is scheduled.
                    </p>
                </div>
              ) : eventsData.map((event, idx) => (
                  <FleetMuster key={idx} event={event} />
              ))
            )}
          </div>


          <div className="mt-16 border-t border-white/[0.06] pt-12">
            <div className="mb-6 flex items-center gap-2">
              <SafeIcon name="Archive" className="h-4 w-4 text-apf-purpleLight" />
              <h2 className="text-2xl font-semibold tracking-tight text-white">Past musters</h2>
            </div>
            <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface-900/40 px-6 py-12 text-center">
              <p className="text-sm font-medium text-white">No after-action reports yet</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                Reports from completed musters are published here once the
                Quartermaster&rsquo;s Provisions signs off on them.
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
