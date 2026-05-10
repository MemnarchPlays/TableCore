'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCombatStore } from '@/store/combat'

export type SyncState = 'idle' | 'pending' | 'error'

export function usePersistToDB() {
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sync = useCallback(async (encounterId: string) => {
    const s = useCombatStore.getState()
    try {
      const res = await fetch(`/api/encounters/${encounterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: s.encounterName,
          round: s.round,
          activeIndex: s.activeIndex,
          isStarted: s.isStarted,
          combatants: s.combatants.map(({ isSelected: _s, ...c }) => c),
        }),
      })
      if (!res.ok) throw new Error('sync failed')
      setSyncState('idle')
    } catch {
      setSyncState('error')
    }
  }, [])

  useEffect(() => {
    const unsub = useCombatStore.subscribe((state, prev) => {
      if (!state.encounterId) return
      if (
        state.combatants === prev.combatants &&
        state.activeIndex === prev.activeIndex &&
        state.round === prev.round &&
        state.isStarted === prev.isStarted &&
        state.encounterName === prev.encounterName
      ) return

      setSyncState('pending')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => sync(state.encounterId!), 1000)
    })
    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sync])

  return { syncState, clearError: () => setSyncState('idle') }
}
