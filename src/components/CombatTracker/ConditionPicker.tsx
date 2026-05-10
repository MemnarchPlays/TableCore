'use client'

import { useState } from 'react'
import { useCombatStore } from '@/store/combat'
import type { ExpiryTrigger } from '@/types/combat'
import { STANDARD_CONDITIONS, isLeveledCondition, getLevelCount, getConditionMechanic } from '@/data/conditions'

interface Props {
  combatantId: string
  onDone: () => void
}

export default function ConditionPicker({ combatantId, onDone }: Props) {
  const { addCondition } = useCombatStore()
  const [customName, setCustomName] = useState('')
  const [rounds, setRounds] = useState('1')
  const [permanent, setPermanent] = useState(false)
  const [trigger, setTrigger] = useState<ExpiryTrigger>('StartOfTurn')
  const [pendingLeveled, setPendingLeveled] = useState<string | null>(null)

  const apply = (name: string) => {
    if (!name.trim()) return
    addCondition(combatantId, {
      name: name.trim(),
      remainingRounds: permanent ? null : Math.max(1, parseInt(rounds, 10) || 1),
      expiryTrigger: trigger,
      isConcentration: name === 'Concentrating',
    })
    onDone()
  }

  const handleConditionClick = (name: string) => {
    if (isLeveledCondition(name)) {
      setPendingLeveled(name)
    } else {
      apply(name)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 space-y-3">
      {/* Duration controls — set these BEFORE clicking a condition */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={permanent}
            onChange={(e) => setPermanent(e.target.checked)}
            className="accent-amber-400"
          />
          Permanent
        </label>

        {!permanent && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Rounds:</label>
            <input
              type="number"
              min="1"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              className="w-16 min-h-[44px] px-2 rounded bg-zinc-700 text-zinc-100 border border-zinc-600 text-sm focus:outline-none focus:border-[var(--accent-400)] text-center"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Expires:</label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as ExpiryTrigger)}
            className="min-h-[44px] px-2 rounded bg-zinc-700 text-zinc-100 border border-zinc-600 text-sm focus:outline-none focus:border-[var(--accent-400)]"
          >
            <option value="StartOfTurn">Start of Turn</option>
            <option value="EndOfTurn">End of Turn</option>
          </select>
        </div>
      </div>

      {/* Inline level selector for leveled conditions */}
      {pendingLeveled && (
        <div className="pt-1 border-t border-zinc-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300 font-medium">{pendingLeveled} — choose level:</span>
            <button
              onClick={() => setPendingLeveled(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: getLevelCount(pendingLeveled) }, (_, i) => {
              const level = i + 1
              const mechanic = getConditionMechanic(`${pendingLeveled} ${level}`)
              return (
                <div key={level} className="relative group/lvl">
                  <button
                    onClick={() => apply(`${pendingLeveled} ${level}`)}
                    className="min-h-[44px] min-w-[44px] px-3 rounded text-sm bg-amber-900/40 text-amber-200 border border-amber-800 hover:bg-amber-800/60 active:bg-amber-700 transition-colors font-semibold"
                  >
                    {level}
                  </button>
                  {mechanic && (
                    <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-64 rounded bg-zinc-700 border border-zinc-600 px-2.5 py-1.5 text-xs leading-snug text-zinc-200 opacity-0 transition-opacity group-hover/lvl:opacity-100">
                      {mechanic}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick conditions — hover for mechanic description */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-700">
        {STANDARD_CONDITIONS.map(({ name, mechanic }) => (
          <div key={name} className="relative group/cond">
            <button
              onClick={() => handleConditionClick(name)}
              className={[
                'min-h-[44px] px-3 rounded text-sm border transition-colors',
                pendingLeveled === name
                  ? 'bg-amber-900/60 text-amber-200 border-amber-700'
                  : 'bg-purple-900/40 text-purple-200 border-purple-800 hover:bg-purple-800/60 active:bg-purple-700',
              ].join(' ')}
            >
              {name}
            </button>
            <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-56 rounded bg-zinc-700 border border-zinc-600 px-2.5 py-1.5 text-xs leading-snug text-zinc-200 opacity-0 transition-opacity group-hover/cond:opacity-100">
              {mechanic}
            </div>
          </div>
        ))}
      </div>

      {/* Custom condition */}
      <div className="flex gap-2 pt-1 border-t border-zinc-700">
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') apply(customName) }}
          placeholder="Custom condition name…"
          className="flex-1 min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 text-sm focus:outline-none focus:border-[var(--accent-400)]"
        />
        <button
          onClick={() => apply(customName)}
          disabled={!customName.trim()}
          className="min-h-[44px] px-4 rounded bg-zinc-600 text-zinc-200 text-sm font-medium hover:bg-zinc-500 disabled:opacity-30 transition-colors"
        >
          Add
        </button>
        <button
          onClick={onDone}
          className="min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-400 text-sm hover:bg-zinc-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
