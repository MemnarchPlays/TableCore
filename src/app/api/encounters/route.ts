import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const encounters = await prisma.encounter.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { combatants: true } } },
  })
  return NextResponse.json(encounters)
}

export async function POST(request: Request) {
  const body = await request.json()
  const encounter = await prisma.encounter.create({
    data: { name: body.name ?? 'New Encounter' },
  })
  return NextResponse.json(encounter, { status: 201 })
}
