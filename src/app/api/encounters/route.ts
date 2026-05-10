import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const encounters = await prisma.encounter.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { combatants: true } } },
    })
    return NextResponse.json(encounters)
  } catch (err) {
    console.error('[GET /api/encounters]', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const encounter = await prisma.encounter.create({
      data: { name: body.name ?? 'New Encounter' },
    })
    return NextResponse.json(encounter, { status: 201 })
  } catch (err) {
    console.error('[POST /api/encounters]', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }
}
