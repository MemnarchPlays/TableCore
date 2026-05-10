'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCombatStore } from '@/store/combat'
import { useSettingsStore } from '@/store/settings'
import { usePersistToDB } from '@/hooks/usePersistToDB'
import InitiativeList from './InitiativeList'
import CombatantCard from './CombatantCard'
import AddCombatantModal from './AddCombatantModal'
import BulkActionBar from './BulkActionBar'
import SettingsModal from '@/components/Settings/SettingsModal'

export default function CombatTracker() {
  const {
    combatants, activeIndex, round, isStarted, encounterName,
    startCombat, resetCombat, nextTurn, prevTurn, undo, redo,
    past, future, setEncounterId, encounterId,
  } = useCombatStore()

  const { syncState, clearError } = usePersistToDB()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [restoreError, setRestoreError] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  const [inspectedId, setInspectedId] = useState<string | null>(null)

  const { accentColor } = useSettingsStore()

  // Restore accent colour setting
  useEffect(() => {
    useSettingsStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [accentColor])

  // On mount: restore active encounter from DB if an ID was saved
  useEffect(() => {
    const savedId = localStorage.getItem('tablecore-active-id')
    if (!savedId) return
    if (useCombatStore.getState().encounterId) return // already loaded (e.g. resume flow)

    fetch(`/api/encounters/${savedId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        useCombatStore.getState().loadEncounter({
          id: data.id,
          name: data.name,
          round: data.round,
          activeIndex: data.activeIndex,
          isStarted: data.isStarted,
          combatants: data.combatants.map(({ position: _p, ...c }: { position: number; [k: string]: unknown }) => c),
        })
      })
      .catch(() => {
        localStorage.removeItem('tablecore-active-id')
        setRestoreError(true)
      })
  }, [])

  // Auto-switch to detail view on mobile when combat starts
  useEffect(() => {
    if (isStarted) setMobileView('detail')
  }, [isStarted])

  // Clear inspected combatant when turn advances
  useEffect(() => {
    setInspectedId(null)
  }, [activeIndex])

  const activeCombatant = activeIndex !== null ? combatants[activeIndex] ?? null : null
  const inspectedCombatant = inspectedId ? combatants.find((c) => c.id === inspectedId) ?? null : null
  const displayCombatant = inspectedCombatant ?? activeCombatant
  const selectedCount = combatants.filter((c) => c.isSelected).length

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 bg-zinc-800 border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-bold text-base sm:text-lg tracking-wide text-[var(--accent-400)]">TableCORE</span>
          {isStarted && (
            <span className="text-zinc-400 text-sm">
              R<span className="hidden sm:inline">ound </span><span className="text-zinc-100 font-semibold">{round}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="min-h-[44px] min-w-[44px] px-2 sm:px-3 rounded text-sm font-medium bg-zinc-700 disabled:opacity-30 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
            title="Undo"
          >
            ↩
          </button>
          {/* Redo — hidden on mobile to save space */}
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="hidden sm:inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3 rounded text-sm font-medium bg-zinc-700 disabled:opacity-30 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
            title="Redo"
          >
            ↪
          </button>

          <div className="hidden sm:block w-px h-6 bg-zinc-600" />

          {isStarted && (
            <>
              <button
                onClick={prevTurn}
                disabled={combatants.length === 0}
                className="min-h-[44px] px-2 sm:px-4 rounded text-sm font-medium bg-zinc-700 disabled:opacity-30 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
              >
                ←<span className="hidden sm:inline"> Prev</span>
              </button>
              <button
                onClick={() => { nextTurn(); setMobileView('detail') }}
                disabled={combatants.length === 0}
                className="min-h-[44px] px-3 sm:px-4 rounded text-sm font-semibold bg-[var(--accent-500)] text-zinc-900 hover:bg-[var(--accent-400)] active:bg-[var(--accent-600)] transition-colors"
              >
                Next<span className="hidden sm:inline"> Turn</span> →
              </button>
            </>
          )}

          {!isStarted && (
            <button
              onClick={async () => {
                startCombat()
                if (!encounterId) {
                  try {
                    const res = await fetch('/api/encounters', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: encounterName }),
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setEncounterId(data.id)
                    }
                  } catch { /* sync will catch up on next change */ }
                }
              }}
              disabled={combatants.length === 0}
              className="min-h-[44px] px-3 sm:px-5 rounded text-sm font-semibold bg-green-600 text-white hover:bg-green-500 active:bg-green-700 disabled:opacity-30 transition-colors"
            >
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start Combat</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="min-h-[44px] px-3 sm:px-4 rounded text-sm font-medium bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
          >
            + Add
          </button>

          {/* Sync indicator — only shown when an encounter is tracked */}
          {encounterId && syncState === 'pending' && (
            <span className="hidden sm:inline text-xs text-zinc-400 px-2" title="Saving…">●</span>
          )}

          <Link
            href="/encounters"
            className="hidden sm:inline-flex min-h-[44px] items-center px-3 rounded text-sm bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
            title="Encounter history"
          >
            History
          </Link>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-sm bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            ⚙
          </button>

          {/* Reset — hidden on mobile to save space */}
          {isStarted && (
            <button
              onClick={() => { if (confirm('Reset combat? This clears all combatants.')) resetCombat() }}
              className="hidden sm:inline-flex min-h-[44px] px-3 rounded text-sm font-medium text-red-400 bg-zinc-700 hover:bg-red-900/40 active:bg-red-900/60 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Initiative sidebar
            Mobile: full-width when mobileView='list', hidden when mobileView='detail'
            sm+: always visible as fixed 288px sidebar */}
        <aside className={[
          'shrink-0 border-r border-zinc-700 overflow-y-auto',
          mobileView === 'list' ? 'w-full sm:w-72' : 'hidden sm:block sm:w-72',
        ].join(' ')}>
          <InitiativeList
            combatants={combatants}
            activeIndex={activeIndex}
            isStarted={isStarted}
            inspectedId={inspectedId}
            onInspect={(id) => { setInspectedId(id); setMobileView('detail') }}
          />
        </aside>

        {/* Main panel
            Mobile: full-width when mobileView='detail', hidden when mobileView='list'
            sm+: always visible as flex-1 */}
        <main className={[
          'overflow-y-auto p-4',
          mobileView === 'detail' ? 'flex-1' : 'hidden sm:block sm:flex-1',
        ].join(' ')}>
          {/* Back to initiative list — mobile only */}
          <button
            onClick={() => setMobileView('list')}
            className="sm:hidden mb-3 min-h-[44px] flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors -mx-1 px-1"
          >
            ← Initiative
          </button>

          {displayCombatant ? (
            <CombatantCard combatant={displayCombatant} />
          ) : (
            <EmptyState hasCombatants={combatants.length > 0} isStarted={isStarted} onAdd={() => setShowAddModal(true)} />
          )}
        </main>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="shrink-0 border-t border-zinc-700">
          <BulkActionBar selectedCount={selectedCount} />
        </div>
      )}

      {showAddModal && <AddCombatantModal onClose={() => setShowAddModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}

      {restoreError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-900 border border-red-700 text-red-100 text-sm px-4 py-3 rounded shadow-lg z-50">
          <span>Could not restore session from database.</span>
          <Link
            href="/encounters"
            className="min-h-[44px] px-3 rounded bg-red-700 hover:bg-red-600 font-medium inline-flex items-center"
          >
            View History
          </Link>
          <button
            onClick={() => setRestoreError(false)}
            className="min-h-[44px] px-3 rounded bg-red-800 hover:bg-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {syncState === 'error' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-yellow-900 border border-yellow-700 text-yellow-100 text-sm px-4 py-3 rounded shadow-lg z-50">
          <span>Auto-save failed. Session continues in memory.</span>
          <button
            onClick={clearError}
            className="min-h-[44px] px-3 rounded bg-yellow-700 hover:bg-yellow-600 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasCombatants, isStarted, onAdd }: { hasCombatants: boolean; isStarted: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
      {!hasCombatants && (
        <>
          <p className="text-lg">No combatants yet.</p>
          <button
            onClick={onAdd}
            className="min-h-[44px] px-6 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 text-sm font-medium transition-colors"
          >
            + Add First Combatant
          </button>
        </>
      )}
      {hasCombatants && !isStarted && (
        <p className="text-lg">Press <span className="text-green-400 font-semibold">Start Combat</span> when ready.</p>
      )}
    </div>
  )
}
