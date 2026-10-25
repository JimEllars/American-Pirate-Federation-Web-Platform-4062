import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import { motion } from 'framer-motion';
import { useActiveWallet, useActiveAccount, useConnect, useDisconnect, useWalletDetailsModal } from 'thirdweb/react';
import { client as thirdwebClient } from '../../lib/web3/client';
import { embeddedWallet } from 'thirdweb/wallets';
import { useAppStore } from '../../store/useAppStore';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const address = useActiveAccount()?.address;
  const wallet = useActiveWallet();
  const connectionStatus = wallet ? "connected" : "disconnected";

  const { connect } = useConnect({ client: thirdwebClient });
  const { disconnect } = useDisconnect();
  const { musterRollDraft, guildAlignment, activeTxQueue, enqueueTx, dequeueTx, clearTxQueue } = useAppStore();

  const handleConnect = async () => {
    try {
      await connect(embeddedWallet());
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { name: 'Intel', path: '/intelligence' },
    { name: 'Transmissions', path: '/podcast' },
    { name: 'Directives', path: '/policies' },
    { name: 'Fleet Muster', path: '/events' },
    { name: 'Armory', path: '/shop' },
    { name: 'Direct Democracy', path: '/propose' },
    { name: 'Donate', path: '/donate' }
  ];

  const handleProcessTx = () => {};
  const handlePurgeQueue = () => clearTxQueue();

  const getGuildIcon = () => {
      switch(guildAlignment) {
          case "Shipwright's Guild": return "Terminal";
          case "Surgeon's Dispensary": return "Cross";
          case "Quartermaster's Provisions": return "Package";
          case "Navigator's Guild": return "Compass";
          default: return "Shield";
      }
  };

  return (
    <nav className="fixed w-full z-50 bg-apf-black/90 backdrop-blur-md border-b border-apf-purple/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center justify-between w-1/2 md:w-auto">
            <Link to="/" className="flex items-center gap-3 group">
              <SafeIcon name="Anchor" className="h-8 w-8 text-apf-purple group-hover:text-apf-purpleLight transition-colors" />
              <span className="text-white font-black text-xl tracking-tighter uppercase sm:block hidden">APF</span>
              <span className="text-white font-black text-xl tracking-tighter uppercase sm:hidden block">APF</span>
            </Link>
          </div>

          <div className="hidden lg:block w-full">
            <div className="flex items-center justify-end space-x-6 flex-wrap">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`${
                    location.pathname === link.path
                      ? 'text-apf-purple'
                      : 'text-gray-300 hover:text-white'
                  } px-3 py-2 rounded-md text-sm font-vt323 font-medium uppercase tracking-widest transition-colors whitespace-nowrap`}
                >
                  {link.name}
                </Link>
              ))}

              {musterRollDraft.walletAddress ? (
                  <div className="flex items-center gap-3 px-4 py-1.5 border border-apf-purple/30 bg-black/50 rounded group hover:border-apf-purple transition-colors cursor-default">
                      <SafeIcon name={getGuildIcon()} className="h-4 w-4 text-apf-purple" />
                      <div className="flex flex-col">
                          <span className="font-vt323 text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">{guildAlignment}</span>
                          <span className="font-vt323 text-xs text-apf-emerald uppercase tracking-wider leading-none truncate max-w-[100px]">
                              {musterRollDraft.walletAddress.substring(0, 6)}...{musterRollDraft.walletAddress.substring(musterRollDraft.walletAddress.length - 4)}
                          </span>
                      </div>
                  </div>
              ) : (
                  <a href="/#join" className="bg-apf-purple hover:bg-apf-purpleLight text-white font-bold py-2 px-4 rounded transition-all shadow-[0_0_15px_rgba(113,0,255,0.5)] hover:shadow-[0_0_25px_rgba(113,0,255,0.8)] font-vt323 tracking-widest text-lg">
                    JOIN THE FLEET
                  </a>
              )}

              {activeTxQueue?.length > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={handleProcessTx} className="flex items-center gap-2 px-3 py-1.5 border border-apf-emerald bg-black/50 rounded animate-pulse cursor-pointer hover:border-apf-emerald/80 hover:bg-black/80">
                    <div className="w-2 h-2 rounded-full bg-apf-emerald shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <span className="font-vt323 text-sm text-apf-emerald uppercase tracking-wider leading-none">
                      [ {activeTxQueue.length} PENDING TX ]
                    </span>
                  </button>
                  <button onClick={handlePurgeQueue} className="text-xs text-red-500/50 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all px-2 py-1 ml-2">
                    [ PURGE ]
                  </button>
                </div>
              )}

              {(connectionStatus === "connecting" || connectionStatus === "unknown") ? (
                <button
                  disabled
                  className="bg-black border border-apf-purple/50 text-apf-purple opacity-70 px-4 py-2 rounded font-vt323 tracking-widest text-lg uppercase cursor-not-allowed animate-pulse"
                >
                  [ INITIALIZING ENCRYPTION... ]
                </button>
              ) : !address ? (
                <button
                  onClick={handleConnect}
                  className="bg-black border border-apf-purple/50 text-apf-purple hover:bg-apf-purple/10 px-4 py-2 rounded transition-all font-vt323 tracking-widest text-lg uppercase"
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={() => disconnect(wallet)}
                  className="flex items-center gap-2 px-4 py-2 border border-apf-emerald/30 bg-black/50 rounded hover:border-apf-emerald hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300"
                >
                  <div className="w-2 h-2 rounded-full bg-apf-emerald animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                  <span className="font-vt323 text-sm text-apf-emerald uppercase tracking-wider leading-none">
                    {`${address?.substring(0, 4)}...${address?.substring(address?.length - 4)}`}
                  </span>
                </button>
              )}

            </div>
          </div>

          <div className="flex lg:hidden items-center justify-end w-1/2 md:w-auto gap-2">
              {activeTxQueue?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={handleProcessTx} className="flex items-center gap-1.5 px-2 py-1.5 border border-apf-emerald bg-black/50 rounded animate-pulse cursor-pointer hover:border-apf-emerald/80 hover:bg-black/80" title={`${activeTxQueue.length} Pending Tx`}>
                    <div className="w-2 h-2 flex-shrink-0 rounded-full bg-apf-emerald shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <span className="font-vt323 text-xs text-apf-emerald uppercase tracking-wider leading-none hidden sm:inline-block">
                      [ {activeTxQueue.length} PENDING TX ]
                    </span>
                    <span className="font-vt323 text-xs text-apf-emerald uppercase tracking-wider leading-none sm:hidden">
                      [{activeTxQueue.length} TX]
                    </span>
                  </button>
                  <button onClick={handlePurgeQueue} className="text-xs text-red-500/50 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all px-2 py-1 ml-2" title="Purge Queue">
                    [ X ]
                  </button>
                </div>
              )}
              {address && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1.5 border border-apf-emerald/30 bg-black/50 rounded max-w-full overflow-hidden"
                  title="{`${address?.substring(0, 4)}...${address?.substring(address?.length - 4)}`}"
                >
                  <div className="w-2 h-2 flex-shrink-0 rounded-full bg-apf-emerald animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                  <span className="font-vt323 text-xs text-apf-emerald uppercase tracking-wider leading-none truncate">
                    {`${address?.substring(0, 4)}...${address?.substring(address?.length - 4)}`}
                  </span>
                </div>
              )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none flex-shrink-0"
            >
              <SafeIcon name={isOpen ? "X" : "Menu"} className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden bg-apf-black border-b border-apf-purple/20 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-300 hover:text-apf-purple block px-3 py-2 rounded-md text-base font-vt323 font-medium uppercase"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
             {musterRollDraft.walletAddress ? (
                  <div className="flex items-center gap-3 px-3 py-2 mt-4 border-t border-apf-purple/30">
                      <SafeIcon name={getGuildIcon()} className="h-5 w-5 text-apf-purple" />
                      <div className="flex flex-col min-w-0">
                          <span className="font-vt323 text-xs text-gray-500 uppercase tracking-widest truncate">{guildAlignment}</span>
                          <span className="font-vt323 text-sm text-apf-emerald uppercase tracking-wider truncate">
                              {musterRollDraft.walletAddress.substring(0, 8)}...{musterRollDraft.walletAddress.substring(musterRollDraft.walletAddress.length - 6)}
                          </span>
                      </div>
                  </div>
              ) : (
                  <a href="/#join" onClick={() => setIsOpen(false)} className="block mt-4 text-center bg-apf-purple hover:bg-apf-purpleLight text-white font-bold py-2 px-4 rounded transition-all font-vt323 tracking-widest text-lg">
                    JOIN THE FLEET
                  </a>
              )}

              {(connectionStatus === "connecting" || connectionStatus === "unknown") ? (
                <button
                  disabled
                  className="block mt-4 w-full text-center bg-black border border-apf-purple/50 text-apf-purple opacity-70 px-4 py-2 rounded font-vt323 tracking-widest text-lg uppercase cursor-not-allowed animate-pulse"
                >
                  [ INITIALIZING ENCRYPTION... ]
                </button>
              ) : !address ? (
                <button
                  onClick={() => { handleConnect(); setIsOpen(false); }}
                  className="block mt-4 w-full text-center bg-black border border-apf-purple/50 text-apf-purple hover:bg-apf-purple/10 px-4 py-2 rounded transition-all font-vt323 tracking-widest text-lg uppercase"
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={() => { disconnect(wallet); setIsOpen(false); }}
                  className="mt-4 w-full flex justify-center items-center gap-2 px-4 py-2 border border-apf-emerald/30 bg-black/50 rounded hover:border-apf-emerald hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300"
                >
                  <div className="w-2 h-2 rounded-full bg-apf-emerald animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                  <span className="font-vt323 text-sm text-apf-emerald uppercase tracking-wider leading-none">
                    Disconnect ({`${address?.substring(0, 4)}...${address?.substring(address?.length - 4)}`})
                  </span>
                </button>
              )}

          </div>
        </motion.div>
      )}
    </nav>
  );
}
