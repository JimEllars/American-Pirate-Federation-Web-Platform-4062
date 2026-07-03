import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:border-apf-purple/40 hover:shadow-[0_0_15px_rgba(148,0,255,0.5)] transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <SafeIcon name="Hexagon" className="mx-auto h-16 w-16 text-apf-purple mb-6 animate-pulse" />
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 uppercase">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-apf-purple via-apf-purpleLight to-white">
              The New Paradigm
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 font-vt323 tracking-widest text-2xl">
            The American Pirate Federation is a sovereign people's movement. <br/>
            Join Us <SafeIcon name="Flag" className="inline-block" />
          </p>
          
          <div className="mt-10 flex justify-center gap-4">
            <a href="#join" className="px-8 py-4 border border-apf-purple bg-apf-purple/10 hover:bg-apf-purple/30 text-white font-vt323 tracking-widest text-lg transition-all duration-500">
              Initialize Connection
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}