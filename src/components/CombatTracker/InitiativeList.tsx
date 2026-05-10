'use client'

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCombatStore } from '@/store/combat'
import type { Combatant } from '@/types/combat'
import { getConditionMechanic } from '@/data/conditions'

interface ListProps {
  combatants: Combatant[]
  activeIndex: number | null
  isStarted: boolean
  inspectedId: string | null
  onInspect: (id: string) => void
}

interface RowProps {
  combatant: Combatant
  isActive: boolean
  isInspected: boolean
  onInspect: (id: string) => void
}

function hpColor(current: number, max: number) {
  if (max === 0) return 'bg-zinc-600'
  const pct = current / max
  if (pct > 0.5) return 'bg-green-500'
  if (pct > 0.25) return 'bg-yellow-500'
  return 'bg-red-500'
}

function SortableRow({ combatant: c, isActive, isInspected, onInspect }: RowProps) {
  const { toggleSelect, removeCombatant } = useCombatStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id })

  const isDead = c.currentHp === 0 && !c.isEnvironmental
  const hpPct = c.maxHp > 0 ? (c.currentHp / c.maxHp) * 100 : 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={() => onInspect(c.id)}
      className={[
        'relative px-3 py-2 border-l-4 transition-colors select-none cursor-pointer',
        isActive
          ? 'border-[var(--accent-400)] bg-[var(--accent-bg)]'
          : isInspected
          ? 'border-blue-400 bg-blue-400/10'
          : 'border-transparent hover:bg-zinc-800',
        isDead ? 'opacity-40' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 min-h-[44px]">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="min-h-[44px] min-w-[24px] flex items-center justify-center text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          ⠿
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={c.isSelected}
          onChange={() => toggleSelect(c.id)}
          className="w-4 h-4 accent-amber-400 shrink-0 cursor-pointer"
          aria-label={`Select ${c.name}`}
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <span className={['font-semibold text-sm truncate', isActive ? 'text-amber-300' : 'text-zinc-100'].join(' ')}>
              {c.name}
            </span>
            <span className="text-xs font-mono text-zinc-400 shrink-0">
              {c.initiative}
            </span>
          </div>

          {/* HP bar */}
          {!c.isEnvironmental && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={['h-full rounded-full transition-all', hpColor(c.currentHp, c.maxHp)].join(' ')}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 shrink-0 tabular-nums">
                {c.currentHp}/{c.maxHp}
                {c.tempHp > 0 && <span className="text-blue-400">+{c.tempHp}</span>}
              </span>
            </div>
          )}

          {/* Condition badges */}
          {c.conditions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {c.conditions.map((cond) => {
                const mechanic = getConditionMechanic(cond.name)
                return (
                  <div key={cond.id} className="relative group/cond inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-purple-900/60 text-purple-300 border border-purple-800">
                    {cond.name}
                    {cond.remainingRounds !== null && (
                      <span className="text-purple-400 font-mono">{cond.remainingRounds}r</span>
                    )}
                    {mechanic && (
                      <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 w-48 rounded bg-zinc-700 border border-zinc-600 px-2 py-1.5 text-xs leading-snug text-zinc-200 opacity-0 transition-opacity group-hover/cond:opacity-100">
                        {mechanic}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AC badge — hidden for lair actions */}
        {!c.isEnvironmental && (
          <span className="text-xs text-zinc-500 shrink-0" title="AC">
            AC {c.ac}
          </span>
        )}

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); removeCombatant(c.id) }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-600 hover:text-red-400 active:text-red-300 transition-colors shrink-0"
          title={`Remove ${c.name}`}
          aria-label={`Remove ${c.name}`}
        >
          ✕
        </button>
      </div>
    </li>
  )
}

export default function InitiativeList({ combatants, activeIndex, isStarted, inspectedId, onInspect }: ListProps) {
  const { reorderCombatant } = useCombatStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = combatants.findIndex((c) => c.id === active.id)
    const to = combatants.findIndex((c) => c.id === over.id)
    reorderCombatant(from, to)
  }

  if (combatants.length === 0) {
    return (
      <div className="p-4 text-zinc-500 text-sm text-center mt-8">
        No combatants added yet.
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={combatants.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="py-2">
          {combatants.map((c, i) => (
            <SortableRow
              key={c.id}
              combatant={c}
              isActive={isStarted && i === activeIndex}
              isInspected={c.id === inspectedId}
              onInspect={onInspect}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
