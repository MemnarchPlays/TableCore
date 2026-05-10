'use client'

import { useSettingsStore, type SortStrategy } from '@/store/settings'

const OPTIONS: { id: SortStrategy; label: string; description: string }[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'New combatants are sorted by: Initiative → Init Mod → Dex Mod → Dex Score → Name. Use the ⠿ drag handle for any remaining ties.',
  },
  {
    id: 'manual',
    label: 'Manual only',
    description: 'New combatants are appended to the bottom of the list. Use the ⠿ drag handle to set initiative order.',
  },
]

export default function InitiativeTab() {
  const { sortStrategy, setSortStrategy } = useSettingsStore()

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-300">Sort strategy</p>
      {OPTIONS.map(({ id, label, description }) => (
        <label
          key={id}
          className={[
            'flex gap-3 p-3 min-h-[44px] rounded-lg border cursor-pointer transition-colors',
            sortStrategy === id
              ? 'border-[var(--accent-400)] bg-[var(--accent-bg)]'
              : 'border-zinc-700 hover:border-zinc-500',
          ].join(' ')}
        >
          <input
            type="radio"
            name="sortStrategy"
            value={id}
            checked={sortStrategy === id}
            onChange={() => setSortStrategy(id)}
            className="mt-0.5 accent-[var(--accent-500)] shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-zinc-200">{label}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
          </div>
        </label>
      ))}
    </div>
  )
}
