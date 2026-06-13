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
        rsvps: [], // Track event RSVPs
      },
      userRole: 'Unverified', // Roles: Unverified, Deckhand, Navigator, Guild Master
      guildAlignment: 'Unaligned',
      policySignals: {}, // Track signaled policies { policyCode: true }
      policyComments: {}, // Track comments { policyCode: [{ author, role, text, date }] }
      proposedAmendments: [], // [{ id, title, summary, alignment, sponsor, date }]
      reputationPoints: 100, // Mock reputation
      reputationHistory: [], // [{ action, amount, date }]
      toasts: [],
      requisitionHistory: [], // Track purchases [{ id, name, cost, date, status }]
      treasuryAddress: null,
      deployedVaultAddress: '',
      deploymentStatus: 'idle', // idle, pending, success, failed
      treasuryDeploymentStatus: 'idle',
      isSigning: false,

      addToast: (message, type = 'info') => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        useAppStore.getState()._scheduleToastRemoval(id);
        return set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }));
      },

      _scheduleToastRemoval: (id) => {
         setTimeout(() => {
            useAppStore.getState().removeToast(id);
         }, 4000);
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        })),

      updateMusterRoll: (data) =>
        set((state) => {
          const processedData = { ...data };
          if (processedData.walletAddress) {
            processedData.walletAddress = processedData.walletAddress.toLowerCase();
          }
          const newState = {
            musterRollDraft: { ...state.musterRollDraft, ...processedData }
          };

          let newRole = state.userRole;
          let newGuild = state.guildAlignment;

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

          // Guild Assignment based on skillset
          if (data.skills) {
             const skillsLower = data.skills.toLowerCase();
             if (skillsLower.includes('code') || skillsLower.includes('dev')) newGuild = "Shipwright's Guild";
             else if (skillsLower.includes('health') || skillsLower.includes('medic')) newGuild = "Surgeon's Dispensary";
             else if (skillsLower.includes('logistic') || skillsLower.includes('supply')) newGuild = "Quartermaster's Provisions";
             else if (skillsLower.includes('agitprop') || skillsLower.includes('media')) newGuild = "Navigator's Guild";
             else newGuild = "Federation Reserve";
          }

          return { ...newState, userRole: newRole, guildAlignment: newGuild };
        }),

      clearMusterRoll: () =>
        set({
          musterRollDraft: { alias: '', comms: '', skills: '', walletAddress: '', status: 'idle', rsvps: [] },
          userRole: 'Unverified',
          guildAlignment: 'Unaligned'
        }),

      signalPolicy: (policyCode) =>
        set((state) => {
          const isSignaling = !state.policySignals[policyCode];
          const isHumanRightPolicy = ['APF-005', 'APF-006', 'APF-007', 'APF-008', 'APF-009', 'APF-010', 'APF-011', 'APF-012', 'APF-013', 'APF-014'].includes(policyCode);

          let newRep = state.reputationPoints;
          let repHistory = state.reputationHistory;

          if (isSignaling && isHumanRightPolicy) {
              newRep += 20;
              repHistory = [
                 { action: `Authorized ${policyCode}`, amount: 20, date: new Date().toISOString() },
                 ...state.reputationHistory
              ];
          } else if (!isSignaling && isHumanRightPolicy) {
              newRep = Math.max(0, newRep - 20);
          }

          let newRole = state.userRole;
          if (newRep > 500) {
              newRole = 'Guild Master';
          } else if (newRep <= 500 && state.userRole === 'Guild Master') {
              newRole = state.musterRollDraft.status === 'committed' ? 'Navigator' :
                        (state.musterRollDraft.walletAddress ? 'Deckhand' : 'Unverified');
          }

          return {
            policySignals: { ...state.policySignals, [policyCode]: isSignaling },
            reputationPoints: newRep,
            reputationHistory: repHistory,
            userRole: newRole
          };
        }),

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

      addProposedAmendment: (amendment) =>
        set((state) => ({
           proposedAmendments: [{ ...amendment, id: `DRAFT-${state.proposedAmendments.length + 3}`, date: new Date().toISOString() }, ...state.proposedAmendments]
        })),

      registerSignal: (eventName) =>
        set((state) => {
          const newRsvps = [...(state.musterRollDraft.rsvps || []), eventName];
          const repGain = 10;
          const newRep = state.reputationPoints + repGain;
          const repLog = {
             action: `Signal Registered for ${eventName}`,
             amount: repGain,
             date: new Date().toISOString()
          };

          let newRole = state.userRole;
          if (newRep > 500) {
              newRole = 'Guild Master';
          }

          return {
             musterRollDraft: { ...state.musterRollDraft, rsvps: newRsvps },
             reputationPoints: newRep,
             reputationHistory: [repLog, ...state.reputationHistory],
             userRole: newRole
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

      addReputation: (amount, action = "Sovereign Action") =>
        set((state) => {
          const newRep = state.reputationPoints + amount;
          let newRole = state.userRole;

          if (newRep > 500) {
              newRole = 'Guild Master';
          }

          const repLog = {
             action,
             amount,
             date: new Date().toISOString()
          };

          return {
            reputationPoints: newRep,
            userRole: newRole,
            reputationHistory: [repLog, ...state.reputationHistory]
          };
        }),

      setTreasuryAddress: (address) => set({ treasuryAddress: address }),
      setDeployedVaultAddress: (address) => set({ deployedVaultAddress: address }),
      setDeploymentStatus: (status) => set({ deploymentStatus: status }),
      setTreasuryDeploymentStatus: (status) => set({ treasuryDeploymentStatus: status }),
      setIsSigning: (status) => set({ isSigning: status }),

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
            status: state.musterRollDraft.status,
            rsvps: state.musterRollDraft.rsvps
        },
        userRole: state.userRole,
        guildAlignment: state.guildAlignment,
        policySignals: state.policySignals,
        policyComments: state.policyComments,
        proposedAmendments: state.proposedAmendments,
        reputationPoints: state.reputationPoints,
        reputationHistory: state.reputationHistory,
        requisitionHistory: state.requisitionHistory,
        treasuryAddress: state.treasuryAddress,
        deployedVaultAddress: state.deployedVaultAddress,
        deploymentStatus: state.deploymentStatus,
        treasuryDeploymentStatus: state.treasuryDeploymentStatus
      }), // Save only specific parts, ignoring volatile UI state like comms/skills draft
    }
  )
);
