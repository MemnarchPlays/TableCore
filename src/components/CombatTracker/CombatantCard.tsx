'use client'

import { useState } from 'react'
import { useCombatStore } from '@/store/combat'
import type { Combatant } from '@/types/combat'
import ConditionPicker from './ConditionPicker'
import EditCombatantModal from './EditCombatantModal'
import { getConditionMechanic, getLeveledBase, getLevelCount } from '@/data/conditions'
import type { Condition } from '@/types/combat'

interface Props {
  combatant: Combatant
}

export default function CombatantCard({ combatant: c }: Props) {
  const { applyDamage, applyHealing, setTempHp, removeCondition, updateCondition } = useCombatStore()
  const [hpInput, setHpInput] = useState('')
  const [tempInput, setTempInput] = useState('')
  const [showConditionPicker, setShowConditionPicker] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null)
  const [editLevel, setEditLevel] = useState<number | null>(null)
  const [editRounds, setEditRounds] = useState('1')
  const [editPermanent, setEditPermanent] = useState(false)

  const startEdit = (cond: Condition) => {
    const leveledBase = getLeveledBase(cond.name)
    setEditingConditionId(cond.id)
    setEditLevel(leveledBase?.level ?? null)
    setEditPermanent(cond.remainingRounds === null)
    setEditRounds(cond.remainingRounds?.toString() ?? '1')
  }

  const commitEdit = () => {
    if (!editingConditionId) return
    const editCond = c.conditions.find((cond) => cond.id === editingConditionId)
    if (!editCond) return
    const leveledBase = getLeveledBase(editCond.name)
    const newName = leveledBase && editLevel !== null
      ? `${leveledBase.base} ${editLevel}`
      : editCond.name
    updateCondition(c.id, editingConditionId, {
      name: newName,
      remainingRounds: editPermanent ? null : Math.max(1, parseInt(editRounds, 10) || 1),
    })
    setEditingConditionId(null)
  }

  const handleDamage = () => {
    const val = parseInt(hpInput, 10)
    if (!isNaN(val) && val > 0) {
      applyDamage(c.id, val)
      setHpInput('')
    }
  }

  const handleHeal = () => {
    const val = parseInt(hpInput, 10)
    if (!isNaN(val) && val > 0) {
      applyHealing(c.id, val)
      setHpInput('')
    }
  }

  const handleTempHp = () => {
    const val = parseInt(tempInput, 10)
    if (!isNaN(val) && val >= 0) {
      setTempHp(c.id, val)
      setTempInput('')
    }
  }

  const hpPct = c.maxHp > 0 ? Math.round((c.currentHp / c.maxHp) * 100) : 0

  return (
    <div className="max-w-xl space-y-4">
      {/* Name + AC */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-300">{c.name}</h2>
          <div className="flex gap-3 mt-1 text-sm text-zinc-400">
            <span>Initiative <strong className="text-zinc-200">{c.initiative}</strong></span>
            {!c.isEnvironmental && <span>AC <strong className="text-zinc-200">{c.ac}</strong></span>}
            {c.isEnvironmental && <span className="text-yellow-500">Lair Action</span>}
          </div>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
          title="Edit combatant"
          aria-label="Edit combatant"
        >
          ✏
        </button>
      </div>

      {/* HP display */}
      {!c.isEnvironmental && (
        <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold tabular-nums text-zinc-100">{c.currentHp}</span>
            <span className="text-xl text-zinc-500 mb-1">/ {c.maxHp}</span>
            {c.tempHp > 0 && (
              <span className="text-xl text-blue-400 mb-1 font-semibold">+{c.tempHp} temp</span>
            )}
          </div>

          {/* HP bar */}
          <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={[
                'h-full rounded-full transition-all duration-200',
                hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500',
              ].join(' ')}
              style={{ width: `${hpPct}%` }}
            />
          </div>

          {/* HP controls */}
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDamage() }}
              placeholder="Amount"
              className="flex-1 min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
            />
            <button
              onClick={handleDamage}
              className="min-h-[44px] min-w-[44px] px-4 rounded bg-red-700 text-white font-semibold text-sm hover:bg-red-600 active:bg-red-800 transition-colors"
            >
              Damage
            </button>
            <button
              onClick={handleHeal}
              className="min-h-[44px] min-w-[44px] px-4 rounded bg-green-700 text-white font-semibold text-sm hover:bg-green-600 active:bg-green-800 transition-colors"
            >
              Heal
            </button>
          </div>

          {/* Temp HP */}
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTempHp() }}
              placeholder="Temp HP"
              className="w-32 min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-blue-400 text-sm"
            />
            <button
              onClick={handleTempHp}
              className="min-h-[44px] px-4 rounded bg-blue-700 text-white text-sm font-medium hover:bg-blue-600 active:bg-blue-800 transition-colors"
            >
              Set Temp HP
            </button>
          </div>
        </div>
      )}

      {/* Conditions — hidden for lair actions */}
      {!c.isEnvironmental && <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">Conditions</h3>
          <button
            onClick={() => setShowConditionPicker((v) => !v)}
            className="min-h-[44px] px-3 rounded text-sm bg-zinc-700 text-zinc-200 hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
          >
            + Add Condition
          </button>
        </div>

        {showConditionPicker && (
          <ConditionPicker combatantId={c.id} onDone={() => setShowConditionPicker(false)} />
        )}

        {c.conditions.length === 0 && !showConditionPicker && (
          <p className="text-zinc-500 text-sm">No active conditions.</p>
        )}

        {c.conditions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {c.conditions.map((cond) => {
              const mechanic = getConditionMechanic(cond.name)
              return (
                <div
                  key={cond.id}
                  className="relative group/cond flex items-center gap-0.5 px-2 py-1 rounded bg-purple-900/50 border border-purple-800 text-purple-200 text-sm"
                >
                  <span className="font-medium">{cond.name}</span>
                  {cond.remainingRounds !== null && (
                    <span className="font-mono text-purple-400 text-xs ml-1">{cond.remainingRounds}r</span>
                  )}
                  <button
                    onClick={() => startEdit(cond)}
                    className="ml-1 min-h-[44px] px-2 inline-flex items-center justify-center text-purple-400 hover:text-zinc-200 text-xs transition-colors"
                    aria-label={`Edit ${cond.name}`}
                  >
                    ✏
                  </button>
                  <button
                    onClick={() => removeCondition(c.id, cond.id)}
                    className="min-h-[44px] px-2 inline-flex items-center justify-center text-purple-400 hover:text-red-400 text-xs transition-colors"
                    aria-label={`Remove ${cond.name}`}
                  >
                    ✕
                  </button>
                  {mechanic && (
                    <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-56 rounded bg-zinc-700 border border-zinc-600 px-2.5 py-1.5 text-xs leading-snug text-zinc-200 opacity-0 transition-opacity group-hover/cond:opacity-100">
                      {mechanic}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Inline condition editor */}
        {editingConditionId && (() => {
          const editCond = c.conditions.find((cond) => cond.id === editingConditionId)
          if (!editCond) return null
          const leveledBase = getLeveledBase(editCond.name)
          return (
            <div className="rounded-lg border border-zinc-600 bg-zinc-800/60 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  Edit: <span className="text-purple-300">{editCond.name}</span>
                </span>
                <button
                  onClick={() => setEditingConditionId(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Cancel edit"
                >
                  ✕
                </button>
              </div>

              {leveledBase && (
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-400">Level:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: getLevelCount(leveledBase.base) }, (_, i) => {
                      const level = i + 1
                      return (
                        <button
                          key={level}
                          onClick={() => setEditLevel(level)}
                          className={[
                            'min-h-[44px] min-w-[44px] rounded text-sm font-semibold transition-colors',
                            editLevel === level
                              ? 'bg-amber-600 text-white border border-amber-500'
                              : 'bg-zinc-700 text-zinc-200 border border-zinc-600 hover:bg-zinc-600',
                          ].join(' ')}
                        >
                          {level}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={editPermanent}
                    onChange={(e) => setEditPermanent(e.target.checked)}
                    className="accent-amber-400"
                  />
                  Permanent
                </label>
                {!editPermanent && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-400">Rounds:</label>
                    <input
                      type="number"
                      min="1"
                      value={editRounds}
                      onChange={(e) => setEditRounds(e.target.value)}
                      className="w-16 min-h-[44px] px-2 rounded bg-zinc-700 text-zinc-100 border border-zinc-600 text-sm focus:outline-none focus:border-[var(--accent-400)] text-center"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1 border-t border-zinc-700">
                <button
                  onClick={commitEdit}
                  className="flex-1 min-h-[44px] rounded bg-[var(--accent-500)] text-zinc-900 font-semibold text-sm hover:bg-[var(--accent-400)] transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingConditionId(null)}
                  className="min-h-[44px] px-4 rounded bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        })()}
      </div>}

      {showEditModal && (
        <EditCombatantModal combatant={c} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  )
}
