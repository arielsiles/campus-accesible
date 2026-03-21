-- AlterTable
ALTER TABLE "route_segments" ADD COLUMN     "audio_description" TEXT,
ADD COLUMN     "risk_description" TEXT,
ADD COLUMN     "risk_factors" TEXT[] DEFAULT ARRAY[]::TEXT[];
