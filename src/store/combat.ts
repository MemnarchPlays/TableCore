import { create } from 'zustand'
import type { Combatant, CombatantInput, CombatSnapshot, Condition } from '@/types/combat'
import { useSettingsStore } from './settings'

const MAX_HISTORY = 50

// crypto.randomUUID() requires Safari 15.4+ / Chrome 92+; older tablets lack it.
// getRandomValues() has been available since iOS 3.2 / Chrome 11.
function uuid(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function sortedInsert(combatants: Combatant[], next: Combatant): Combatant[] {
  const result = [...combatants, next]
  result.sort((a, b) =>
    b.initiative - a.initiative ||
    b.initMod - a.initMod ||
    b.dexMod - a.dexMod ||
    b.dexScore - a.dexScore ||
    a.name.localeCompare(b.name)
  )
  return result
}

function snap(state: CombatStore): CombatSnapshot {
  return {
    combatants: state.combatants.map(({ isSelected: _s, ...rest }) => rest),
    activeIndex: state.activeIndex,
    round: state.round,
    isStarted: state.isStarted,
  }
}

function pushSnap(past: CombatSnapshot[], current: CombatSnapshot): CombatSnapshot[] {
  return [...past.slice(-(MAX_HISTORY - 1)), current]
}

function tickConditions(combatants: Combatant[], index: number): Combatant[] {
  return combatants.map((c, i) => {
    if (i !== index) return c
    const next = c.conditions
      .map(cond =>
        cond.remainingRounds === null
          ? cond
          : { ...cond, remainingRounds: cond.remainingRounds - 1 }
      )
      .filter(cond => cond.remainingRounds === null || cond.remainingRounds > 0)
    return { ...c, conditions: next }
  })
}

export interface CombatStore {
  combatants: Combatant[]
  activeIndex: number | null
  round: number
  isStarted: boolean
  past: CombatSnapshot[]
  future: CombatSnapshot[]
  encounterId: string | null
  encounterName: string

  setEncounterId: (id: string) => void
  setEncounterName: (name: string) => void
  loadEncounter: (data: {
    id: string
    name: string
    round: number
    activeIndex: number | null
    isStarted: boolean
    combatants: Array<Omit<Combatant, 'isSelected'>>
  }) => void

  addCombatant: (input: CombatantInput) => void
  updateCombatant: (id: string, patch: Partial<CombatantInput>) => void
  removeCombatant: (id: string) => void
  startCombat: () => void
  resetCombat: () => void

  nextTurn: () => void
  prevTurn: () => void

  applyDamage: (id: string, amount: number) => void
  applyHealing: (id: string, amount: number) => void
  setTempHp: (id: string, amount: number) => void

  addCondition: (combatantId: string, condition: Omit<Condition, 'id'>) => void
  updateCondition: (combatantId: string, conditionId: string, patch: Partial<Pick<Condition, 'name' | 'remainingRounds'>>) => void
  removeCondition: (combatantId: string, conditionId: string) => void

  toggleSelect: (id: string) => void
  clearSelection: () => void
  applyBulkDamage: (amount: number) => void
  applyBulkHealing: (amount: number) => void
  applyBulkCondition: (condition: Omit<Condition, 'id'>) => void

  reorderCombatant: (fromIndex: number, toIndex: number) => void

  undo: () => void
  redo: () => void
}

const ACTIVE_ID_KEY = 'tablecore-active-id'

export const useCombatStore = create<CombatStore>()((set) => ({
      combatants: [],
      activeIndex: null,
      round: 0,
      isStarted: false,
      past: [],
      future: [],
      encounterId: null,
      encounterName: 'New Encounter',

      setEncounterId: (id) => {
        if (typeof window !== 'undefined') localStorage.setItem(ACTIVE_ID_KEY, id)
        set({ encounterId: id })
      },
      setEncounterName: (name) => set({ encounterName: name }),

      loadEncounter: (data) => {
        if (typeof window !== 'undefined') localStorage.setItem(ACTIVE_ID_KEY, data.id)
        set({
          encounterId: data.id,
          encounterName: data.name,
          combatants: data.combatants.map((c) => ({ ...c, isSelected: false })),
          activeIndex: data.activeIndex,
          round: data.round,
          isStarted: data.isStarted,
          past: [],
          future: [],
        })
      },

      addCombatant: (input) =>
        set((state) => {
          const newCombatant: Combatant = {
            id: uuid(),
            name: input.name,
            initiative: input.initiative,
            initMod: input.initMod ?? 0,
            dexMod: input.dexMod ?? 0,
            dexScore: input.dexScore ?? 0,
            maxHp: input.maxHp,
            currentHp: input.maxHp,
            tempHp: 0,
            ac: input.ac,
            isEnvironmental: input.isEnvironmental ?? false,
            conditions: [],
            isSelected: false,
          }
          const strategy = useSettingsStore.getState().sortStrategy
          const sorted = strategy === 'manual'
            ? [...state.combatants, newCombatant]
            : sortedInsert(state.combatants, newCombatant)
          // Keep the same combatant active after re-sort
          let newActiveIndex = state.activeIndex
          if (state.isStarted && state.activeIndex !== null) {
            const activeId = state.combatants[state.activeIndex]?.id
            newActiveIndex = sorted.findIndex((c) => c.id === activeId)
          }
          return {
            combatants: sorted,
            activeIndex: newActiveIndex,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      updateCombatant: (id, patch) =>
        set((state) => {
          const idx = state.combatants.findIndex((c) => c.id === id)
          if (idx === -1) return state
          const old = state.combatants[idx]

          let updated: Combatant = { ...old, ...patch }

          if (patch.isEnvironmental) {
            updated = { ...updated, maxHp: 0, ac: 0, currentHp: 0, tempHp: 0 }
          } else if (old.isEnvironmental && patch.isEnvironmental === false) {
            updated = { ...updated, currentHp: updated.maxHp }
          } else if (patch.maxHp !== undefined) {
            updated = { ...updated, currentHp: Math.min(old.currentHp, updated.maxHp) }
          }

          const strategy = useSettingsStore.getState().sortStrategy
          let sorted: Combatant[]
          let newActiveIndex = state.activeIndex

          if (strategy === 'manual') {
            sorted = state.combatants.map((c) => c.id === id ? updated : c)
          } else {
            const withoutCurrent = state.combatants.filter((c) => c.id !== id)
            sorted = sortedInsert(withoutCurrent, updated)
            if (state.activeIndex !== null) {
              const activeId = state.combatants[state.activeIndex]?.id
              newActiveIndex = sorted.findIndex((c) => c.id === activeId)
            }
          }

          return {
            combatants: sorted,
            activeIndex: newActiveIndex,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      removeCombatant: (id) =>
        set((state) => {
          const idx = state.combatants.findIndex((c) => c.id === id)
          if (idx === -1) return state
          const next = state.combatants.filter((c) => c.id !== id)
          let newActiveIndex = state.activeIndex
          if (state.activeIndex !== null) {
            if (idx < state.activeIndex) {
              newActiveIndex = state.activeIndex - 1
            } else if (idx === state.activeIndex) {
              newActiveIndex = next.length > 0 ? Math.min(idx, next.length - 1) : null
            }
          }
          return {
            combatants: next,
            activeIndex: newActiveIndex,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      startCombat: () =>
        set((state) => {
          if (state.combatants.length === 0) return state
          return {
            isStarted: true,
            activeIndex: 0,
            round: 1,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      resetCombat: () => {
        if (typeof window !== 'undefined') localStorage.removeItem(ACTIVE_ID_KEY)
        set({
          combatants: [],
          activeIndex: null,
          round: 0,
          isStarted: false,
          past: [],
          future: [],
          encounterId: null,
          encounterName: 'New Encounter',
        })
      },

      nextTurn: () =>
        set((state) => {
          if (!state.isStarted || state.combatants.length === 0 || state.activeIndex === null)
            return state
          let nextIndex = state.activeIndex + 1
          let nextRound = state.round
          if (nextIndex >= state.combatants.length) {
            nextIndex = 0
            nextRound = state.round + 1
          }
          const newCombatants = tickConditions(state.combatants, nextIndex)
          return {
            combatants: newCombatants,
            activeIndex: nextIndex,
            round: nextRound,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      prevTurn: () =>
        set((state) => {
          if (!state.isStarted || state.combatants.length === 0 || state.activeIndex === null)
            return state
          let prevIndex = state.activeIndex - 1
          let prevRound = state.round
          if (prevIndex < 0) {
            prevIndex = state.combatants.length - 1
            prevRound = Math.max(1, state.round - 1)
          }
          return {
            activeIndex: prevIndex,
            round: prevRound,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      applyDamage: (id, amount) =>
        set((state) => ({
          combatants: state.combatants.map((c) => {
            if (c.id !== id) return c
            const tempAbsorb = Math.min(c.tempHp, amount)
            const remainder = amount - tempAbsorb
            return {
              ...c,
              tempHp: c.tempHp - tempAbsorb,
              currentHp: Math.max(0, c.currentHp - remainder),
            }
          }),
          past: pushSnap(state.past, snap(state)),
          future: [],
        })),

      applyHealing: (id, amount) =>
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id !== id ? c : { ...c, currentHp: Math.min(c.maxHp, c.currentHp + amount) }
          ),
          past: pushSnap(state.past, snap(state)),
          future: [],
        })),

      setTempHp: (id, amount) =>
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id !== id ? c : { ...c, tempHp: Math.max(0, amount) }
          ),
          past: pushSnap(state.past, snap(state)),
          future: [],
        })),

      addCondition: (combatantId, condition) =>
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id !== combatantId
              ? c
              : {
                  ...c,
                  conditions: [
                    ...c.conditions,
                    { ...condition, id: uuid() },
                  ],
                }
          ),
          past: pushSnap(state.past, snap(state)),
          future: [],
        })),

      updateCondition: (combatantId, conditionId, patch) =>
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id !== combatantId
              ? c
              : {
                  ...c,
                  conditions: c.conditions.map((cond) =>
                    cond.id !== conditionId ? cond : { ...cond, ...patch }
                  ),
                }
          ),
          past: pushSnap(state.past, snap(state)),
          future: [],
        })),

      removeCondition: (combatantId, conditionId) =>
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id !== combatantId
              ? c
              : { ...c, conditions: c.conditions.filter((cond) => cond.id !== conditionId) }
          ),
          past: pushSnap(state.past, snap(state)),
          future: [],
        })),

      toggleSelect: (id) =>
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id === id ? { ...c, isSelected: !c.isSelected } : c
          ),
        })),

      clearSelection: () =>
        set((state) => ({
          combatants: state.combatants.map((c) => ({ ...c, isSelected: false })),
        })),

      applyBulkDamage: (amount) =>
        set((state) => {
          const hasSelected = state.combatants.some((c) => c.isSelected)
          if (!hasSelected) return state
          return {
            combatants: state.combatants.map((c) => {
              if (!c.isSelected) return c
              const tempAbsorb = Math.min(c.tempHp, amount)
              const remainder = amount - tempAbsorb
              return {
                ...c,
                tempHp: c.tempHp - tempAbsorb,
                currentHp: Math.max(0, c.currentHp - remainder),
                isSelected: false,
              }
            }),
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      applyBulkHealing: (amount) =>
        set((state) => {
          const hasSelected = state.combatants.some((c) => c.isSelected)
          if (!hasSelected) return state
          return {
            combatants: state.combatants.map((c) =>
              !c.isSelected
                ? c
                : {
                    ...c,
                    currentHp: Math.min(c.maxHp, c.currentHp + amount),
                    isSelected: false,
                  }
            ),
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      applyBulkCondition: (condition) =>
        set((state) => {
          const hasSelected = state.combatants.some((c) => c.isSelected)
          if (!hasSelected) return state
          return {
            combatants: state.combatants.map((c) =>
              !c.isSelected
                ? c
                : {
                    ...c,
                    conditions: [
                      ...c.conditions,
                      { ...condition, id: uuid() },
                    ],
                    isSelected: false,
                  }
            ),
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      reorderCombatant: (fromIndex, toIndex) =>
        set((state) => {
          if (fromIndex === toIndex) return state
          const next = [...state.combatants]
          const [moved] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, moved)

          let newActiveIndex = state.activeIndex
          if (state.activeIndex !== null) {
            if (state.activeIndex === fromIndex) {
              newActiveIndex = toIndex
            } else if (fromIndex < state.activeIndex && state.activeIndex <= toIndex) {
              newActiveIndex = state.activeIndex - 1
            } else if (toIndex <= state.activeIndex && state.activeIndex < fromIndex) {
              newActiveIndex = state.activeIndex + 1
            }
          }

          return {
            combatants: next,
            activeIndex: newActiveIndex,
            past: pushSnap(state.past, snap(state)),
            future: [],
          }
        }),

      undo: () =>
        set((state) => {
          if (state.past.length === 0) return state
          const previous = state.past[state.past.length - 1]
          const current = snap(state)
          return {
            combatants: previous.combatants.map((c) => ({ ...c, isSelected: false })),
            activeIndex: previous.activeIndex,
            round: previous.round,
            isStarted: previous.isStarted,
            past: state.past.slice(0, -1),
            future: [current, ...state.future].slice(0, MAX_HISTORY),
          }
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0) return state
          const next = state.future[0]
          const current = snap(state)
          return {
            combatants: next.combatants.map((c) => ({ ...c, isSelected: false })),
            activeIndex: next.activeIndex,
            round: next.round,
            isStarted: next.isStarted,
            past: pushSnap(state.past, current),
            future: state.future.slice(1),
          }
        }),
  })
)
