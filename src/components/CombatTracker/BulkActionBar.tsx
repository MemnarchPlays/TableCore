'use client'

import { useState } from 'react'
import { useCombatStore } from '@/store/combat'
import type { ExpiryTrigger } from '@/types/combat'

const QUICK_CONDITIONS = ['Prone', 'Stunned', 'Poisoned', 'Blinded', 'Frightened', 'Restrained']

interface Props {
  selectedCount: number
}

export default function BulkActionBar({ selectedCount }: Props) {
  const { applyBulkDamage, applyBulkHealing, applyBulkCondition, clearSelection } = useCombatStore()
  const [amount, setAmount] = useState('')
  const [showConditions, setShowConditions] = useState(false)

  const handleDamage = () => {
    const val = parseInt(amount, 10)
    if (!isNaN(val) && val > 0) { applyBulkDamage(val); setAmount('') }
  }

  const handleHeal = () => {
    const val = parseInt(amount, 10)
    if (!isNaN(val) && val > 0) { applyBulkHealing(val); setAmount('') }
  }

  const handleCondition = (name: string) => {
    applyBulkCondition({ name, remainingRounds: 1, expiryTrigger: 'StartOfTurn' as ExpiryTrigger, isConcentration: false })
    setShowConditions(false)
  }

  return (
    <div className="bg-zinc-800 px-3 sm:px-4 py-2 sm:py-3 space-y-1.5 sm:space-y-2">
      {/*
        Mobile:  two explicit rows (flex-col) — row 1: count+input+damage+heal, row 2: condition+clear
        sm+:     single flex-row that may wrap — same layout as before
      */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">

        {/* Group 1: selected count + amount input + damage + heal */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--accent-400)] shrink-0">
            {selectedCount}<span className="hidden sm:inline"> selected</span>×
          </span>

          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleDamage() }}
            placeholder="Amount"
            className="w-20 sm:w-28 min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-100 placeholder-zinc-500 border border-zinc-600 focus:outline-none focus:border-[var(--accent-400)] text-sm"
          />

          <button
            onClick={handleDamage}
            className="min-h-[44px] px-3 sm:px-4 rounded bg-red-700 text-white text-sm font-semibold hover:bg-red-600 active:bg-red-800 transition-colors"
          >
            <span className="sm:hidden">Damage</span>
            <span className="hidden sm:inline">Bulk Damage</span>
          </button>
          <button
            onClick={handleHeal}
            className="min-h-[44px] px-3 sm:px-4 rounded bg-green-700 text-white text-sm font-semibold hover:bg-green-600 active:bg-green-800 transition-colors"
          >
            <span className="sm:hidden">Heal</span>
            <span className="hidden sm:inline">Bulk Heal</span>
          </button>
        </div>

        {/* Group 2: condition + clear — pushed right on sm+ */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            onClick={() => setShowConditions((v) => !v)}
            className="min-h-[44px] px-3 sm:px-4 rounded bg-purple-800 text-purple-200 text-sm font-medium hover:bg-purple-700 active:bg-purple-900 transition-colors"
          >
            <span className="sm:hidden">+ Condition</span>
            <span className="hidden sm:inline">Add Condition</span>
          </button>
          <button
            onClick={clearSelection}
            className="min-h-[44px] px-3 rounded bg-zinc-700 text-zinc-400 text-sm hover:bg-zinc-600 transition-colors"
          >
            <span className="sm:hidden">Clear</span>
            <span className="hidden sm:inline">Clear selection</span>
          </button>
        </div>
      </div>

      {showConditions && (
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_CONDITIONS.map((name) => (
            <button
              key={name}
              onClick={() => handleCondition(name)}
              className="min-h-[44px] px-3 rounded text-sm bg-purple-900/40 text-purple-200 border border-purple-800 hover:bg-purple-800/60 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
