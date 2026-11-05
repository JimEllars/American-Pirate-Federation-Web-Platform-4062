import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMember, getSession, signOutPassport } from '../lib/api/members';

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
      // --- Pirate Passport -------------------------------------------------
      // Audit F37/F38/F39: the only authoritative statement about who a visitor is the
      // Supabase session and the `members` row it owns. `userRole` and `guildAlignment`
      // above are mirrors of that row. Nothing in this browser writes them any more:
      // connecting a wallet used to promote a visitor to Deckhand, committing a local
      // draft promoted them to Navigator, and 500 locally-clicked points made them a
      // Guild Master. Those ranks were then shown as "Clearance" and gated /policies and
      // /propose, so the site told visitors the Federation had ranked them when the
      // members table had never heard of them.
      //
      // status: 'unknown' (not yet asked) | 'anonymous' | 'passport-only' (signed in,
      // not on the roll) | 'enrolled' | 'error'
      passport: { status: 'unknown', session: null, member: null, error: null },
      // The Passport dialog is opened from the navigation bar, from the muster form and from
      // every place that needs an identity to act. One flag, so those callers cannot drift.
      isPassportOpen: false,
      openPassport: () => set({ isPassportOpen: true }),
      closePassport: () => set({ isPassportOpen: false }),
      policySignals: {}, // Track signaled policies { policyCode: true }
      policyComments: {}, // Track comments { policyCode: [{ author, role, text, date }] }
      proposedAmendments: [], // [{ id, title, summary, alignment, sponsor, date }]
      // Starts at zero because no civic action has been taken yet. This is a local ledger of
      // actions taken in this browser (zustand `persist`), not a Federation record — the
      // earlier seeded value of 100 handed every first-time visitor reputation points they
      // had never earned and priced /shop against them (Architectural Law 1).
      reputationPoints: 0,
      reputationHistory: [], // [{ action, amount, date }]
      toasts: [],
      requisitionHistory: [], // Track purchases [{ id, name, cost, date, status }]
      treasuryAddress: null,
      deployedVaultAddress: '',
      deploymentStatus: 'idle', // idle, pending, success, failed
      treasuryDeploymentStatus: 'idle',
      isSigning: false,
      isCorrectNetwork: true,
      setIsCorrectNetwork: (status) => set({ isCorrectNetwork: status }),
      isCoreSynced: false,
      setIsCoreSynced: (status) => set({ isCoreSynced: status }),
      lastSyncTime: null,
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      aiContextPayload: null,
      setAiContextPayload: (payload) => set({ aiContextPayload: payload }),
      aiDecryptedResponse: null,
      setAiDecryptedResponse: (response) => set({ aiDecryptedResponse: response }),
      activeTxQueue: [],
      enqueueTx: (tx) => set((state) => ({ activeTxQueue: [...state.activeTxQueue, tx] })),
      dequeueTx: (txId) => set((state) => ({ activeTxQueue: state.activeTxQueue.filter(t => t.id !== txId) })),
      clearTxQueue: () => set({ activeTxQueue: [] }),
      telemetryLogs: [],
      addTelemetryLog: (message) => set((state) => ({ telemetryLogs: [message, ...state.telemetryLogs].slice(0, 3) })),

      // What the client actually observed when it last POSTed to /api/telemetry.
      // The shell used to render "[ INGRESS: CLOUDFLARE_EDGE_ACTIVE ]" unconditionally,
      // asserting an edge state it never probed. This is the observed outcome instead:
      //   state: 'idle' | 'accepted' | 'rejected' | 'unreachable'
      // Not persisted — a reading from a previous session is not a reading.
      ingressStatus: { state: 'idle', count: 0, http: null, at: null },
      setIngressStatus: (status) => set({ ingressStatus: status }),

      addToast: (message, type = 'info', persistent = false) => {
        const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Date.now().toString(36);
        if (!persistent) {
          useAppStore.getState()._scheduleToastRemoval(id);
        }
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }));
        return id;
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
          // The draft is exactly that: a draft. It never assigns rank or guild — those
          // come back from the members row (see refreshPassport).
          return { musterRollDraft: { ...state.musterRollDraft, ...processedData } };
        }),

      /**
       * Read the session and the member row it owns, and mirror the Federation-assigned
       * rank/guild into the fields the UI reads. Called once at boot (App.jsx) and after
       * sign-in, sign-out and enrollment.
       */
      refreshPassport: async () => {
        const session = await getSession();

        if (!session?.user) {
          set({
            passport: { status: 'anonymous', session: null, member: null, error: null },
            userRole: 'Unverified',
            guildAlignment: 'Unaligned'
          });
          return;
        }

        try {
          const member = await fetchMember(session.user.id);
          set({
            passport: { status: member ? 'enrolled' : 'passport-only', session, member, error: null },
            userRole: member?.role ?? 'Unverified',
            guildAlignment: member?.guild ?? 'Unaligned'
          });
        } catch (err) {
          set({
            passport: { status: 'error', session, member: null, error: err?.message || 'The muster roll is unreachable.' },
            userRole: 'Unverified',
            guildAlignment: 'Unaligned'
          });
        }
      },

      signOutPassport: async () => {
        await signOutPassport();
        set({
          passport: { status: 'anonymous', session: null, member: null, error: null },
          userRole: 'Unverified',
          guildAlignment: 'Unaligned'
        });
      },

      clearMusterRoll: () =>
        set({
          musterRollDraft: { alias: '', comms: '', skills: '', walletAddress: '', status: 'idle', rsvps: [] }
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

          return {
            policySignals: { ...state.policySignals, [policyCode]: isSignaling },
            reputationPoints: newRep,
            reputationHistory: repHistory
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

          return {
             musterRollDraft: { ...state.musterRollDraft, rsvps: newRsvps },
             reputationPoints: newRep,
             reputationHistory: [repLog, ...state.reputationHistory]
          };
        }),

      spendReputation: (amount) =>
        set((state) => ({ reputationPoints: Math.max(0, state.reputationPoints - amount) })),

      addReputation: (amount, action = "Sovereign Action") =>
        set((state) => {
          const newRep = state.reputationPoints + amount;

          const repLog = {
             action,
             amount,
             date: new Date().toISOString()
          };

          return {
            reputationPoints: newRep,
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
      name: 'apf-tx-queue',
      partialize: (state) => ({
        activeTxQueue: state.activeTxQueue,
        aiDecryptedResponse: state.aiDecryptedResponse,
        requisitionHistory: state.requisitionHistory,
        reputationPoints: state.reputationPoints,
        reputationHistory: state.reputationHistory,
        musterRollDraft: state.musterRollDraft,
        policySignals: state.policySignals
      }),
      version: 2,
      // v1 persisted `userRole`/`guildAlignment`, which let an old browser keep a rank the
      // Federation never assigned. Drop them on upgrade; they are re-derived from the
      // member row at boot.
      migrate: (persisted, version) => {
        if (!persisted || version >= 2) return persisted;
        const next = { ...persisted };
        delete next.userRole;
        delete next.guildAlignment;
        return next;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[Zustand] Rehydration error, resetting state:', error);
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('apf-tx-queue');
          }
        }
      }
    }
  )
);
