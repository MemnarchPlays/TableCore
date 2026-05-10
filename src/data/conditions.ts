export interface ConditionDef {
  name: string
  mechanic: string     // generic summary — shown on hover before a level is chosen
  levels?: string[]    // per-level mechanic text (index 0 = level 1); presence marks condition as leveled
}

export const STANDARD_CONDITIONS: ConditionDef[] = [
  { name: 'Blinded',       mechanic: "Can't see. Auto-fails sight checks. Attacks made: disadvantage. Attacks received: advantage." },
  { name: 'Charmed',       mechanic: "Can't attack charmer or target them with harmful abilities. Charmer has advantage on social checks." },
  { name: 'Concentrating', mechanic: 'Maintaining concentration on a spell. Damaged → DC 10 or ½-damage Con save or lose the spell.' },
  { name: 'Deafened',      mechanic: "Can't hear. Auto-fails hearing checks." },
  {
    name: 'Exhaustion',
    mechanic: 'Cumulative levels 1–6. Each level: −(2 × level) to d20 Tests, Speed −(5 × level) ft. Level 6: death. Long rest removes 1 level.',
    levels: [
      'Level 1: −2 to d20 Tests (ability checks, attack rolls, saving throws). Speed −5 ft.',
      'Level 2: −4 to d20 Tests. Speed −10 ft.',
      'Level 3: −6 to d20 Tests. Speed −15 ft.',
      'Level 4: −8 to d20 Tests. Speed −20 ft.',
      'Level 5: −10 to d20 Tests. Speed −25 ft.',
      'Level 6: Death. (−12 to d20 Tests. Speed −30 ft.)',
    ],
  },
  { name: 'Frightened',    mechanic: "Disadvantage on checks/attacks while source is visible. Can't willingly move closer to source." },
  { name: 'Grappled',      mechanic: 'Speed becomes 0. Ends if grappler is incapacitated or target escapes (Athletics/Acrobatics).' },
  { name: 'Incapacitated', mechanic: "Can't take actions or reactions." },
  { name: 'Invisible',     mechanic: 'Heavily obscured. Attacks made: advantage. Attacks received: disadvantage.' },
  { name: 'Paralyzed',     mechanic: "Incapacitated, can't move or speak. Auto-fails Str/Dex saves. Attacks: advantage. Hits within 5 ft are crits." },
  { name: 'Petrified',     mechanic: 'Turned to stone. Incapacitated. Resistance to all damage. Immune to poison and disease.' },
  { name: 'Poisoned',      mechanic: 'Disadvantage on attack rolls and ability checks.' },
  { name: 'Prone',         mechanic: 'Disadvantage on attacks. Attacks within 5 ft: advantage; beyond 5 ft: disadvantage. Standing costs ½ move.' },
  { name: 'Restrained',    mechanic: 'Speed 0. Attack rolls: disadvantage. Attacks received: advantage. Dex saves: disadvantage.' },
  { name: 'Stunned',       mechanic: "Incapacitated, can't move, can only speak falteringly. Auto-fails Str/Dex saves. Attacks: advantage." },
  { name: 'Unconscious',   mechanic: "Incapacitated, can't move or speak. Drops held items, falls prone. Auto-fails Str/Dex saves. Hits within 5 ft are crits." },
]

const MECHANIC_MAP = new Map(STANDARD_CONDITIONS.map((c) => [c.name, c.mechanic]))

const LEVELED_DEFS = STANDARD_CONDITIONS.filter((c) => c.levels != null)

export function getConditionMechanic(name: string): string | null {
  // Direct match (flat conditions and base leveled name)
  const direct = MECHANIC_MAP.get(name)
  if (direct !== undefined) return direct

  // Leveled match: "Exhaustion 2" → base "Exhaustion" + level 2
  for (const cond of LEVELED_DEFS) {
    if (name.startsWith(cond.name + ' ')) {
      const level = parseInt(name.slice(cond.name.length + 1), 10)
      if (!isNaN(level) && level >= 1 && cond.levels && level <= cond.levels.length) {
        return cond.levels[level - 1]
      }
    }
  }

  return null
}

export function isLeveledCondition(name: string): boolean {
  return LEVELED_DEFS.some((c) => c.name === name)
}

export function getLevelCount(name: string): number {
  return LEVELED_DEFS.find((c) => c.name === name)?.levels?.length ?? 0
}
