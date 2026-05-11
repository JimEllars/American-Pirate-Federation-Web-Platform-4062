import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function Ticker() {
  const updates = [
    "NODE 01: OPERATIONAL",
    "PROTOCOL V2.4 DEPLOYED",
    "NEW DIRECTIVE ISSUED",
    "MUSTER ROLL: +42 RECRUITS",
    "SIGNAL STRENGTH: OPTIMAL"
  ];

  const duplicatedUpdates = [...updates, ...updates, ...updates];

  return (
    <div className="w-full bg-apf-purple/10 border-y border-apf-purple/30 overflow-hidden py-2 flex items-center">
      <div className="w-full relative flex whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20
          }}
          className="flex gap-8 items-center text-apf-purpleLight font-mono text-sm uppercase tracking-wider"
        >
          {duplicatedUpdates.map((text, i) => (
            <div key={i} className="flex items-center gap-4">
              <SafeIcon name="Radio" className="text-apf-purple" />
              <span>{text}</span>
              <span className="text-apf-purple/50">|</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}