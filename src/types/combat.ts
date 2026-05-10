export type ExpiryTrigger = 'StartOfTurn' | 'EndOfTurn'

export interface Condition {
  id: string
  name: string
  remainingRounds: number | null // null = permanent
  expiryTrigger: ExpiryTrigger
  isConcentration: boolean
}

export interface Combatant {
  id: string
  name: string
  initiative: number
  initMod: number
  dexMod: number
  dexScore: number
  maxHp: number
  currentHp: number
  tempHp: number
  ac: number
  isEnvironmental: boolean
  conditions: Condition[]
  isSelected: boolean
}

export interface CombatantInput {
  name: string
  initiative: number
  initMod?: number
  dexMod?: number
  dexScore?: number
  maxHp: number
  ac: number
  isEnvironmental?: boolean
}

export interface CombatSnapshot {
  combatants: Omit<Combatant, 'isSelected'>[]
  activeIndex: number | null
  round: number
  isStarted: boolean
}
