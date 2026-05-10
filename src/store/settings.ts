import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AccentColor = 'amber' | 'blue' | 'teal' | 'purple' | 'red'
export type SortStrategy = 'auto' | 'manual'

interface SettingsStore {
  accentColor: AccentColor
  sortStrategy: SortStrategy
  setAccentColor: (color: AccentColor) => void
  setSortStrategy: (strategy: SortStrategy) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      accentColor: 'amber',
      sortStrategy: 'auto',
      setAccentColor: (color) => set({ accentColor: color }),
      setSortStrategy: (strategy) => set({ sortStrategy: strategy }),
    }),
    {
      name: 'tablecore-settings',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      skipHydration: true,
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('Settings could not be restored; using defaults.')
      },
    }
  )
)
