'use client'

import { useState } from 'react'
import { useCombatStore } from '@/store/combat'
import type { Combatant } from '@/types/combat'

interface Props {
  combatant: Combatant
  onClose: () => void
}

export default function EditCombatantModal({ combatant: c, onClose }: Props) {
  const { updateCombatant } = useCombatStore()

  const [name, setName] = useState(c.name)
  const [initiative, setInitiative] = useState(String(c.initiative))
  const [initMod, setInitMod] = useState(c.initMod !== 0 ? String(c.initMod) : '')
  const [dexMod, setDexMod] = useState(c.dexMod !== 0 ? String(c.dexMod) : '')
  const [dexScore, setDexScore] = useState(c.dexScore !== 0 ? String(c.dexScore) : '')
  const [maxHp, setMaxHp] = useState(c.isEnvironmental ? '' : String(c.maxHp))
  const [ac, setAc] = useState(c.isEnvironmental ? '10' : String(c.ac))
  const [isEnvironmental, setIsEnvironmental] = useState(c.isEnvironmental)
  const [showTiebreakers, setShowTiebreakers] = useState(
    c.initMod !== 0 || c.dexMod !== 0 || c.dexScore !== 0
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    const init = parseInt(initiative, 10)
    if (isNaN(init)) { setError('Initiative must be a number.'); return }
    const hp = parseInt(maxHp, 10)
    if (!isEnvironmental && (isNaN(hp) || hp < 1)) { setError('Max HP must be at least 1.'); return }
    const acVal = parseInt(ac, 10)
    if (!isEnvironmental && isNaN(acVal)) { setError('AC must be a number.'); return }

    updateCombatant(c.id, {
      name: name.trim(),
      initiative: init,
      initMod: initMod !== '' ? (parseInt(initMod, 10) || 0) : 0,
      dexMod: dexMod !== '' ? (parseInt(dexMod, 10) || 0) : 0,
      dexScore: dexScore !== '' ? (parseInt(dexScore, 10) || 0) : 0,
      maxHp: isEnvironmental ? 0 : hp,
      ac: isEnvironmental ? 0 : acVal,
      isEnvironmental,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md max-h-[90dvh] flex flex-col bg-zinc-800 border border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-zinc-100">Edit Combatant</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] text-zinc-400 hover:text-zinc-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-5 space-y-3 pb-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Name *</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Initiative *</label>
              <input
                type="number"
                value={initiative}
                onChange={(e) => setInitiative(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
              />
            </div>

            {!isEnvironmental && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowTiebreakers((v) => !v)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  {showTiebreakers ? '▴' : '▾'} Tiebreakers
                </button>
                {showTiebreakers && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Init Mod</label>
                      <input
                        type="number"
                        value={initMod}
                        onChange={(e) => setInitMod(e.target.value)}
                        placeholder="0"
                        className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Dex Mod</label>
                      <input
                        type="number"
                        value={dexMod}
                        onChange={(e) => setDexMod(e.target.value)}
                        placeholder="0"
                        className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Dex Score</label>
                      <input
                        type="number"
                        value={dexScore}
                        onChange={(e) => setDexScore(e.target.value)}
                        placeholder="10"
                        className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Max HP {isEnvironmental && <span className="text-zinc-500">(ignored)</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxHp}
                  onChange={(e) => setMaxHp(e.target.value)}
                  disabled={isEnvironmental}
                  placeholder="30"
                  className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm disabled:opacity-40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  AC {isEnvironmental && <span className="text-zinc-500">(ignored)</span>}
                </label>
                <input
                  type="number"
                  value={ac}
                  onChange={(e) => setAc(e.target.value)}
                  disabled={isEnvironmental}
                  placeholder="10"
                  className="w-full min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm disabled:opacity-40"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={isEnvironmental}
                onChange={(e) => setIsEnvironmental(e.target.checked)}
                className="w-4 h-4 accent-amber-400"
              />
              <span className="text-sm text-zinc-300">Environmental / Lair Action (no HP)</span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          <div className="px-5 pb-5 pt-3 shrink-0">
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded bg-[var(--accent-500)] text-zinc-900 font-semibold text-sm hover:bg-[var(--accent-400)] active:bg-[var(--accent-600)] transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
