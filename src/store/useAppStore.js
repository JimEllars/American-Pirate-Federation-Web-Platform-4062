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
        status: 'idle'
      },
      updateMusterRoll: (data) => 
        set((state) => ({ 
          musterRollDraft: { ...state.musterRollDraft, ...data } 
        })),
      clearMusterRoll: () => 
        set({ 
          musterRollDraft: { alias: '', comms: '', skills: '', walletAddress: '', status: 'idle' }
        }),
    }),
    {
      name: 'apf-muster-storage', // Save to local storage for resilience
    }
  )
);