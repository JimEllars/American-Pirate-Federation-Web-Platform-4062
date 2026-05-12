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
      policyComments: {}, // Track comments { policyCode: [{ author, role, text, date }] }
      reputationPoints: 100, // Mock reputation
      requisitionHistory: [], // Track purchases [{ id, name, cost, date, status }]

      updateMusterRoll: (data) =>
        set((state) => {
          const newState = {
            musterRollDraft: { ...state.musterRollDraft, ...data }
          };

          let newRole = state.userRole;

          // Sovereign Role Escalation
          if (newState.musterRollDraft.walletAddress && state.userRole === 'Unverified') {
            newRole = 'Deckhand';
          }

          if (newState.musterRollDraft.status === 'committed' && (newRole === 'Deckhand' || newRole === 'Unverified')) {
              newRole = 'Navigator';
          }

          if (state.reputationPoints > 500) {
              newRole = 'Guild Master';
          }

          return { ...newState, userRole: newRole };
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

      addPolicyComment: (policyCode, comment) =>
        set((state) => {
           const existing = state.policyComments[policyCode] || [];
           return {
               policyComments: {
                   ...state.policyComments,
                   [policyCode]: [...existing, comment]
               }
           };
        }),

      spendReputation: (amount) =>
        set((state) => {
          const newRep = Math.max(0, state.reputationPoints - amount);
          let newRole = state.userRole;

          // Re-evaluate role on reputation change
          if (newRep <= 500 && state.userRole === 'Guild Master') {
              newRole = state.musterRollDraft.status === 'committed' ? 'Navigator' :
                        (state.musterRollDraft.walletAddress ? 'Deckhand' : 'Unverified');
          }

          return { reputationPoints: newRep, userRole: newRole };
        }),

      addReputation: (amount) =>
        set((state) => {
          const newRep = state.reputationPoints + amount;
          let newRole = state.userRole;

          if (newRep > 500) {
              newRole = 'Guild Master';
          }

          return { reputationPoints: newRep, userRole: newRole };
        }),

      addRequisition: (item) =>
        set((state) => ({
           requisitionHistory: [{ ...item, date: new Date().toISOString(), status: 'AUTHORIZED' }, ...state.requisitionHistory]
        }))
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
        policyComments: state.policyComments,
        reputationPoints: state.reputationPoints,
        requisitionHistory: state.requisitionHistory
      }), // Save only specific parts, ignoring volatile UI state like comms/skills draft
    }
  )
);
