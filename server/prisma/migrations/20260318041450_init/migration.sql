-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "waypoint_type" AS ENUM ('BUILDING', 'ENTRANCE', 'INTERSECTION', 'BUS_STOP', 'METRO', 'LANDMARK', 'PARKING', 'ACCESSIBILITY_FEATURE');

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waypoints" (
    "id" TEXT NOT NULL,
    "waypoint_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "waypoint_type" "waypoint_type" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "route_id" TEXT NOT NULL,

    CONSTRAINT "waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_segments" (
    "id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surface_type" TEXT NOT NULL,
    "elevation_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "risk_level" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "route_id" TEXT NOT NULL,

    CONSTRAINT "route_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waypoints_waypoint_id_key" ON "waypoints"("waypoint_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_segments_segment_id_key" ON "route_segments"("segment_id");

-- AddForeignKey
ALTER TABLE "waypoints" ADD CONSTRAINT "waypoints_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
