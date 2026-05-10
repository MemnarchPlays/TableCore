'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCombatStore } from '@/store/combat'
import type { Combatant, Condition } from '@/types/combat'

interface EncounterRow {
  id: string
  name: string
  round: number
  isStarted: boolean
  createdAt: string
  updatedAt: string
  _count: { combatants: number }
}

interface EncounterDetail {
  id: string
  name: string
  round: number
  activeIndex: number | null
  isStarted: boolean
  combatants: Array<Omit<Combatant, 'isSelected'> & { conditions: Condition[]; position: number }>
}

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<EncounterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resuming, setResuming] = useState<string | null>(null)
  const router = useRouter()
  const { loadEncounter } = useCombatStore()

  useEffect(() => {
    fetch('/api/encounters')
      .then((r) => r.json())
      .then((data) => { setEncounters(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleResume = async (id: string) => {
    setResuming(id)
    try {
      const res = await fetch(`/api/encounters/${id}`)
      if (!res.ok) throw new Error('not found')
      const data: EncounterDetail = await res.json()
      loadEncounter({
        id: data.id,
        name: data.name,
        round: data.round,
        activeIndex: data.activeIndex,
        isStarted: data.isStarted,
        combatants: data.combatants.map(({ position: _p, ...c }) => c),
      })
      router.push('/')
    } catch {
      setResuming(null)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/encounters/${id}`, { method: 'DELETE' })
    setEncounters((prev) => prev.filter((e) => e.id !== id))
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="px-4 sm:px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="min-h-[44px] px-3 rounded text-sm bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-[var(--accent-400)]">Encounter History</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          className="min-h-[44px] px-4 rounded text-sm font-medium bg-zinc-700 hover:bg-zinc-600 transition-colors"
        >
          + New Encounter
        </button>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-3xl">
        {loading && (
          <p className="text-zinc-400 text-sm">Loading…</p>
        )}

        {!loading && encounters.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">No saved encounters yet.</p>
            <p className="text-sm mt-1">Start a combat and it will appear here.</p>
          </div>
        )}

        {!loading && encounters.length > 0 && (
          <ul className="space-y-2">
            {encounters.map((enc) => (
              <li
                key={enc.id}
                className="flex items-center gap-3 p-4 rounded-lg bg-zinc-800 border border-zinc-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-100 truncate">{enc.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {enc._count.combatants} combatant{enc._count.combatants !== 1 ? 's' : ''}
                    {' · '}
                    {enc.isStarted ? `Round ${enc.round}` : 'Not started'}
                    {' · '}
                    {new Date(enc.updatedAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleResume(enc.id)}
                  disabled={resuming === enc.id}
                  className="min-h-[44px] px-4 rounded text-sm font-medium bg-[var(--accent-500)] text-zinc-900 hover:bg-[var(--accent-400)] disabled:opacity-50 transition-colors shrink-0"
                >
                  {resuming === enc.id ? '…' : 'Resume'}
                </button>
                <button
                  onClick={() => setDeleteTarget(enc.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                  aria-label="Delete encounter"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-zinc-100 font-semibold">Delete this encounter?</p>
            <p className="text-sm text-zinc-400">This cannot be undone. All combatants and conditions will be removed.</p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 min-h-[44px] rounded bg-red-700 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 min-h-[44px] rounded bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
