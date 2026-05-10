-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'New Encounter',
    "round" INTEGER NOT NULL DEFAULT 0,
    "activeIndex" INTEGER,
    "isStarted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combatant" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initiative" DOUBLE PRECISION NOT NULL,
    "initMod" INTEGER NOT NULL DEFAULT 0,
    "dexMod" INTEGER NOT NULL DEFAULT 0,
    "dexScore" INTEGER NOT NULL DEFAULT 10,
    "maxHp" INTEGER NOT NULL DEFAULT 0,
    "currentHp" INTEGER NOT NULL DEFAULT 0,
    "tempHp" INTEGER NOT NULL DEFAULT 0,
    "ac" INTEGER NOT NULL DEFAULT 0,
    "isEnvironmental" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Combatant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveCondition" (
    "id" TEXT NOT NULL,
    "combatantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "remainingRounds" INTEGER,
    "expiryTrigger" TEXT NOT NULL DEFAULT 'StartOfTurn',
    "isConcentration" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActiveCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Encounter_publicSlug_key" ON "Encounter"("publicSlug");

-- AddForeignKey
ALTER TABLE "Combatant" ADD CONSTRAINT "Combatant_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveCondition" ADD CONSTRAINT "ActiveCondition_combatantId_fkey" FOREIGN KEY ("combatantId") REFERENCES "Combatant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
