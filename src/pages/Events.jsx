import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageTransition } from '../components/layout/PageTransition';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <SafeIcon name="Target" className="h-10 w-10 text-apf-purple" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                Fleet Muster
              </h1>
            </div>
            <p className="max-w-2xl text-gray-400 font-mono text-lg">
              Physical and digital convergence points for the federation. Presence is participation.
            </p>
          </div>
          <div className="border-t border-gray-800">
            {loading ? (
                <div className="py-12 flex items-center justify-center text-apf-emerald font-vt323 animate-pulse bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl">
                    [ NAV-COMMS: SYNCING FLEET MUSTER COORDINATES... ]
                </div>
            ) : (
                eventsData.length === 0 ? (
                <div className="py-12 flex items-center justify-center text-gray-400 font-vt323 text-xl bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl">
                    No active fleet gatherings scheduled. Connect your Pirate Passport to receive dispatch notices.
                </div>
              ) : eventsData.map((event, idx) => (
                  <FleetMuster key={idx} event={event} />
              ))
            )}
          </div>


          <div className="mt-24 border-t border-gray-800 pt-16">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-3">
              <SafeIcon name="Archive" className="text-apf-purple" />
              Past Musters / Dispatch Reports
            </h2>
            <div className="py-12 px-6 text-center bg-black/60 backdrop-blur-2xl border border-white/5 shadow-2xl">
              <div className="font-vt323 text-apf-purple text-lg uppercase tracking-widest mb-2">[ ARCHIVE EMPTY ]</div>
              <p className="font-vt323 text-gray-400 max-w-xl mx-auto">
                No dispatch reports have been published yet. After-action reports from completed musters are published here once the Quartermaster&rsquo;s Provisions signs off on them.
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
