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
    }),
    {
      name: 'apf-muster-storage', // Save to local storage for resilience
    }
  )
);
