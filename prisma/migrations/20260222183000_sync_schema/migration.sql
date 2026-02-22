-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'ACCEPTED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "globalRole" "Role" NOT NULL DEFAULT 'USER';
