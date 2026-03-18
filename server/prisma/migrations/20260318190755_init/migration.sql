-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "waypoint_type" AS ENUM ('entrance', 'intersection', 'building', 'transport_stop', 'landmark', 'hazard', 'rest_area', 'information_point');

-- CreateEnum
CREATE TYPE "surface_type" AS ENUM ('paved', 'cobblestone', 'gravel', 'dirt', 'tactile');

-- CreateEnum
CREATE TYPE "risk_level" AS ENUM ('none', 'low', 'medium', 'high');

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
    "order_index" INTEGER NOT NULL,
    "route_id" TEXT NOT NULL,

    CONSTRAINT "waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_segments" (
    "id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surface_type" "surface_type" NOT NULL,
    "elevation_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "risk_level" "risk_level" NOT NULL DEFAULT 'none',
    "geometry_geojson" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
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
