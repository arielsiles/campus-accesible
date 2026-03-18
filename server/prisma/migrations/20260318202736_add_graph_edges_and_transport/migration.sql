-- CreateEnum
CREATE TYPE "transport_type" AS ENUM ('metro', 'bus', 'intercambiador', 'cercanias');

-- AlterTable
ALTER TABLE "waypoints" ADD COLUMN     "transport_lines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "transport_type" "transport_type";

-- CreateTable
CREATE TABLE "graph_edges" (
    "id" TEXT NOT NULL,
    "from_waypoint_id" TEXT NOT NULL,
    "to_waypoint_id" TEXT NOT NULL,
    "segment_id" TEXT,
    "distance" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bidirectional" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "graph_edges_from_waypoint_id_to_waypoint_id_key" ON "graph_edges"("from_waypoint_id", "to_waypoint_id");

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_from_waypoint_id_fkey" FOREIGN KEY ("from_waypoint_id") REFERENCES "waypoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_to_waypoint_id_fkey" FOREIGN KEY ("to_waypoint_id") REFERENCES "waypoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "route_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
