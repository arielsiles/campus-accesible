// FR-008: Seed script — test route Medicina → Metro Ciudad Universitaria
// Aligned with SPEC-FASE-1.md §4.2 enums
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.routeSegment.deleteMany();
  await prisma.waypoint.deleteMany();
  await prisma.route.deleteMany();

  // Waypoint coordinates [lng, lat] for GeoJSON geometry
  const coords = {
    medicina: [-3.7267, 40.4489],
    odontologia: [-3.7258, 40.4479],
    farmacia: [-3.7271, 40.4471],
    busFarmacia: [-3.7275, 40.4465],
    metroCU: [-3.7302, 40.4449],
  };

  const route = await prisma.route.create({
    data: {
      id: "test-route-1",
      name: "Medicina → Metro Ciudad Universitaria",
      description:
        "Ruta accesible desde la Facultad de Medicina hasta la estación de Metro Ciudad Universitaria",
      waypoints: {
        create: [
          {
            waypointId: "wp-medicina",
            name: "Facultad de Medicina",
            description: "Entrada principal de la Facultad de Medicina (UCM)",
            waypointType: "building",
            latitude: 40.4489,
            longitude: -3.7267,
            orderIndex: 0,
          },
          {
            waypointId: "wp-odontologia",
            name: "Facultad de Odontología",
            description: "Cruce frente a la Facultad de Odontología",
            waypointType: "intersection",
            latitude: 40.4479,
            longitude: -3.7258,
            orderIndex: 1,
          },
          {
            waypointId: "wp-farmacia",
            name: "Facultad de Farmacia",
            description: "Entrada lateral de la Facultad de Farmacia",
            waypointType: "building",
            latitude: 40.4471,
            longitude: -3.7271,
            orderIndex: 2,
          },
          {
            waypointId: "wp-bus-farmacia",
            name: "Parada de bus Farmacia",
            description: "Parada de autobús frente a Farmacia, líneas G y U",
            waypointType: "transport_stop",
            latitude: 40.4465,
            longitude: -3.7275,
            orderIndex: 3,
          },
          {
            waypointId: "wp-metro-cu",
            name: "Metro Ciudad Universitaria",
            description:
              "Estación de Metro Ciudad Universitaria, línea 6 (circular)",
            waypointType: "transport_stop",
            latitude: 40.4449,
            longitude: -3.7302,
            orderIndex: 4,
          },
        ],
      },
      segments: {
        create: [
          {
            segmentId: "seg-medicina-odonto",
            name: "Medicina a Odontología",
            surfaceType: "paved",
            elevationChange: -1.2,
            riskLevel: "none",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.medicina, coords.odontologia],
            }),
            orderIndex: 0,
          },
          {
            segmentId: "seg-odonto-farmacia",
            name: "Odontología a Farmacia",
            surfaceType: "paved",
            elevationChange: -0.5,
            riskLevel: "none",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.odontologia, coords.farmacia],
            }),
            orderIndex: 1,
          },
          {
            segmentId: "seg-farmacia-bus",
            name: "Farmacia a parada de bus",
            surfaceType: "paved",
            elevationChange: 0,
            riskLevel: "none",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.farmacia, coords.busFarmacia],
            }),
            orderIndex: 2,
          },
          {
            segmentId: "seg-bus-metro",
            name: "Parada de bus a Metro",
            surfaceType: "paved",
            elevationChange: -2.3,
            riskLevel: "low",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.busFarmacia, coords.metroCU],
            }),
            orderIndex: 3,
          },
        ],
      },
    },
    include: {
      waypoints: true,
      segments: true,
    },
  });

  console.log(
    `Seed complete: route "${route.name}" with ${route.waypoints.length} waypoints and ${route.segments.length} segments`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
