-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "elo" INTEGER NOT NULL DEFAULT 1200,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "memberships" TEXT[];

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ranking_logs" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_inviteCode_key" ON "organizations"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_organizationId_key" ON "organization_members"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "matches_organizationId_idx" ON "matches"("organizationId");

-- CreateIndex
CREATE INDEX "tournaments_organizationId_idx" ON "tournaments"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (will be added after data migration)
-- ALTER TABLE "matches" ADD CONSTRAINT "matches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (will be added after data migration)
-- ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- DATA MIGRATION: Create "Capgemini" org and assign all existing data
-- ============================================================

-- 1. Create the Capgemini organization
INSERT INTO "organizations" ("id", "name", "slug", "inviteCode", "createdAt", "updatedAt")
VALUES (
    'capgemini_org_001',
    'Capgemini',
    'capgemini',
    'CAPG2026',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. Create organization memberships for all existing users
INSERT INTO "organization_members" ("id", "userId", "organizationId", "role", "elo", "joinedAt")
SELECT 
    'orgmem_' || u.id,
    u.id,
    'capgemini_org_001',
    u.role,
    u.elo,
    u."createdAt"
FROM "users" u;

-- 3. Assign all existing matches to Capgemini
UPDATE "matches" SET "organizationId" = 'capgemini_org_001' WHERE "organizationId" IS NULL;

-- 4. Assign all existing tournaments to Capgemini
UPDATE "tournaments" SET "organizationId" = 'capgemini_org_001' WHERE "organizationId" IS NULL;

-- 5. Assign all existing ranking logs to Capgemini
UPDATE "ranking_logs" SET "organizationId" = 'capgemini_org_001' WHERE "organizationId" IS NULL;

-- ============================================================
-- Now add the foreign key constraints (after data is populated)
-- ============================================================

-- Make organizationId NOT NULL and add foreign keys
ALTER TABLE "matches" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "matches" ADD CONSTRAINT "matches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournaments" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
