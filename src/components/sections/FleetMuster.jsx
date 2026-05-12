import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useAppStore } from '../../store/useAppStore';

const { FiMapPin, FiUsers, FiClock } = FiIcons;

export function FleetMuster({ event }) {
  const { musterRollDraft, registerSignal } = useAppStore();
  const isCommitted = musterRollDraft.status === 'committed';
  const hasRSVPd = musterRollDraft.rsvps?.includes(event.title);

  // Mock alias generation based on hash for demo purposes if actual names aren't tracked server-side yet
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  const getMockAliases = () => {
     const count = Math.abs(hashString(event.title)) % 5 + 2; // 2 to 6 aliases
     const bases = ['Ghost', 'Cipher', 'Null', 'Void', 'Neon', 'Chrome', 'Byte'];
     const aliases = [];
     for(let i=0; i<count; i++) {
         aliases.push(`${bases[(Math.abs(hashString(event.title + i))) % bases.length]}_${(Math.abs(hashString(event.title + i * 2))) % 99}`);
     }
     if (hasRSVPd && musterRollDraft.alias) aliases.unshift(musterRollDraft.alias);
     return aliases.slice(0, 5); // show max 5
  };

  const registeredAliases = getMockAliases();


  return (
    <div className="flex flex-col p-6 border-b border-gray-800 hover:bg-apf-purple/5 transition-colors group">
      <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <div className="text-4xl font-black text-apf-purple/40 group-hover:text-apf-purple transition-colors">
              {event.date.split(' ')[0]}
              <span className="block text-sm uppercase text-gray-500">{event.date.split(' ')[1]}</span>
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1">
                <SafeIcon icon={FiMapPin} className="text-apf-purple" /> {event.location}
              </span>
              <span className="flex items-center gap-1">
                <SafeIcon icon={FiClock} className="text-apf-purple" /> {event.time}
              </span>
              <span className="flex items-center gap-1">
                <SafeIcon icon={FiUsers} className="text-apf-purple" /> {event.capacity}
              </span>
            </div>
          </div>

          <div className="md:w-1/4 flex items-center justify-end">
            <button
              onClick={() => isCommitted && !hasRSVPd && registerSignal(event.title)}
              className={`px-6 py-2 border font-mono text-xs uppercase transition-all tracking-widest ${
                hasRSVPd
                  ? 'bg-apf-purple text-white border-apf-purple cursor-default'
                  : isCommitted
                    ? 'border-apf-purple text-apf-purple hover:bg-apf-purple hover:text-white'
                    : 'border-gray-800 text-gray-600 cursor-not-allowed bg-black/50'
              }`}>
              {hasRSVPd ? 'Signal Registered' : (isCommitted ? 'Register Signal' : 'Clearance Reqd')}
            </button>
          </div>
      </div>
      
      {/* Registered Signals List */}
      <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-wrap items-center gap-3">
          <span className="font-vt323 text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <SafeIcon name="Radio" className="h-3 w-3" /> Signals Detected:
          </span>
          <div className="flex flex-wrap gap-2">
              {registeredAliases.map((alias, i) => (
                  <span key={i} className={`font-vt323 text-xs px-2 py-0.5 border ${alias === musterRollDraft.alias ? 'border-apf-emerald text-apf-emerald bg-apf-emerald/10' : 'border-gray-700 text-gray-400 bg-gray-900'}`}>
                      {alias}
                  </span>
              ))}
              {Math.abs(hashString(event.title)) % 10 > 5 && (
                  <span className="font-vt323 text-xs text-gray-600 px-2 py-0.5">+{Math.abs(hashString(event.title)) % 15 + 3} more...</span>
              )}
          </div>
      </div>
    </div>
  );
}
