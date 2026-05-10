'use client'

import { useSettingsStore, type AccentColor } from '@/store/settings'

const ACCENTS: { id: AccentColor; label: string; hex: string }[] = [
  { id: 'amber',  label: 'Amber',  hex: '#f59e0b' },
  { id: 'blue',   label: 'Blue',   hex: '#3b82f6' },
  { id: 'teal',   label: 'Teal',   hex: '#14b8a6' },
  { id: 'purple', label: 'Purple', hex: '#a855f7' },
  { id: 'red',    label: 'Red',    hex: '#ef4444' },
]

export default function AppearanceTab() {
  const { accentColor, setAccentColor } = useSettingsStore()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-300 mb-3">Accent color</p>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map(({ id, label, hex }) => (
            <button
              key={id}
              onClick={() => setAccentColor(id)}
              className={[
                'flex flex-col items-center gap-1.5 min-h-[44px] min-w-[44px] p-1 rounded-lg transition-colors',
                accentColor === id ? 'bg-zinc-700' : 'hover:bg-zinc-800',
              ].join(' ')}
              aria-label={`${label} accent`}
              title={label}
            >
              <span
                className={[
                  'w-9 h-9 rounded-full block',
                  accentColor === id ? 'ring-2 ring-offset-2 ring-offset-zinc-800 ring-zinc-200' : '',
                ].join(' ')}
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs text-zinc-400">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Accent applies to the active-combatant indicator, primary buttons, input focus rings, and the header wordmark.
      </p>
    </div>
  )
}
