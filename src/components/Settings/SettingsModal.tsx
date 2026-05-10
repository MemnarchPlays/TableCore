'use client'

import { useState } from 'react'
import AppearanceTab from './AppearanceTab'
import InitiativeTab from './InitiativeTab'

type Tab = 'appearance' | 'initiative'

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'initiative', label: 'Initiative' },
]

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance')

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-50 w-full max-w-md max-h-[90dvh] flex flex-col bg-zinc-800 border border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] text-zinc-400 hover:text-zinc-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-zinc-700 px-5 shrink-0">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'min-h-[44px] px-4 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === id
                  ? 'text-[var(--accent-400)] border-[var(--accent-400)]'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'initiative' && <InitiativeTab />}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] rounded bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
