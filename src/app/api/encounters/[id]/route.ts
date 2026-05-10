import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const encounter = await prisma.encounter.findUnique({
      where: { id },
      include: {
        combatants: {
          orderBy: { position: 'asc' },
          include: { conditions: true },
        },
      },
    })
    if (!encounter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(encounter)
  } catch (err) {
    console.error('[GET /api/encounters/:id]', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, round, activeIndex, isStarted, combatants } = await request.json()

    await prisma.$transaction(async (tx) => {
      await tx.encounter.update({
        where: { id },
        data: { name, round, activeIndex: activeIndex ?? null, isStarted },
      })
      await tx.combatant.deleteMany({ where: { encounterId: id } })
      for (let position = 0; position < combatants.length; position++) {
        const c = combatants[position]
        await tx.combatant.create({
          data: {
            id: c.id,
            encounterId: id,
            name: c.name,
            initiative: c.initiative,
            initMod: c.initMod ?? 0,
            dexMod: c.dexMod ?? 0,
            dexScore: c.dexScore ?? 10,
            maxHp: c.maxHp,
            currentHp: c.currentHp,
            tempHp: c.tempHp,
            ac: c.ac,
            isEnvironmental: c.isEnvironmental ?? false,
            position,
            conditions: {
              create: (c.conditions ?? []).map((cond: {
                id: string
                name: string
                remainingRounds: number | null
                expiryTrigger: string
                isConcentration: boolean
              }) => ({
                id: cond.id,
                name: cond.name,
                remainingRounds: cond.remainingRounds ?? null,
                expiryTrigger: cond.expiryTrigger ?? 'StartOfTurn',
                isConcentration: cond.isConcentration ?? false,
              })),
            },
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/encounters/:id]', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.encounter.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/encounters/:id]', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }
}
