import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiMapPin, FiUsers, FiClock } = FiIcons;

export function FleetMuster({ event }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 border-b border-gray-800 hover:bg-apf-purple/5 transition-colors group">
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
        <button className="px-6 py-2 border border-apf-purple text-apf-purple font-mono text-xs uppercase hover:bg-apf-purple hover:text-white transition-all tracking-widest">
          Secure Slot
        </button>
      </div>
    </div>
  );
}