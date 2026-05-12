import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      musterRollDraft: {
        alias: '',
        comms: '',
        skills: '',
        walletAddress: '',
        status: 'idle',
      },
      userRole: 'Unverified', // Roles: Unverified, Deckhand, Navigator, Guild Master
      policySignals: {}, // Track signaled policies { policyCode: true }
      reputationPoints: 100, // Mock reputation
      updateMusterRoll: (data) =>
        set((state) => {
          let newRole = state.userRole;

          // Basic logic to determine user role based on wallet or activity
          if (data.walletAddress && state.userRole === 'Unverified') {
            newRole = 'Deckhand';
          }

          if (data.status === 'committed' && newRole === 'Deckhand') {
              newRole = 'Navigator';
          }

          return {
            musterRollDraft: { ...state.musterRollDraft, ...data },
            userRole: newRole
          };
        }),
      clearMusterRoll: () =>
        set({
          musterRollDraft: { alias: '', comms: '', skills: '', walletAddress: '', status: 'idle' },
          userRole: 'Unverified'
        }),
      signalPolicy: (policyCode) =>
        set((state) => ({
          policySignals: { ...state.policySignals, [policyCode]: !state.policySignals[policyCode] }
        })),
      spendReputation: (amount) =>
        set((state) => ({
          reputationPoints: Math.max(0, state.reputationPoints - amount)
        })),
    }),
    {
      name: 'apf-muster-storage', // Save to local storage for resilience
      partialize: (state) => ({
        musterRollDraft: {
            alias: state.musterRollDraft.alias,
            walletAddress: state.musterRollDraft.walletAddress,
            status: state.musterRollDraft.status
        },
        userRole: state.userRole,
        policySignals: state.policySignals,
        reputationPoints: state.reputationPoints
      }), // Save only specific parts, ignoring volatile UI state like comms/skills draft
    }
  )
);
