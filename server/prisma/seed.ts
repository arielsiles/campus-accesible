// FR-008: Seed script — test route Medicina → Metro Ciudad Universitaria
import { PrismaClient, WaypointType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.routeSegment.deleteMany();
  await prisma.waypoint.deleteMany();
  await prisma.route.deleteMany();

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
            waypointType: WaypointType.BUILDING,
            latitude: 40.4489,
            longitude: -3.7267,
            order: 0,
          },
          {
            waypointId: "wp-odontologia",
            name: "Facultad de Odontología",
            description: "Cruce frente a la Facultad de Odontología",
            waypointType: WaypointType.INTERSECTION,
            latitude: 40.4479,
            longitude: -3.7258,
            order: 1,
          },
          {
            waypointId: "wp-farmacia",
            name: "Facultad de Farmacia",
            description: "Entrada lateral de la Facultad de Farmacia",
            waypointType: WaypointType.BUILDING,
            latitude: 40.4471,
            longitude: -3.7271,
            order: 2,
          },
          {
            waypointId: "wp-bus-farmacia",
            name: "Parada de bus Farmacia",
            description: "Parada de autobús frente a Farmacia, líneas G y U",
            waypointType: WaypointType.BUS_STOP,
            latitude: 40.4465,
            longitude: -3.7275,
            order: 3,
          },
          {
            waypointId: "wp-metro-cu",
            name: "Metro Ciudad Universitaria",
            description:
              "Estación de Metro Ciudad Universitaria, línea 6 (circular)",
            waypointType: WaypointType.METRO,
            latitude: 40.4449,
            longitude: -3.7302,
            order: 4,
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
            riskLevel: 0,
            order: 0,
          },
          {
            segmentId: "seg-odonto-farmacia",
            name: "Odontología a Farmacia",
            surfaceType: "paved",
            elevationChange: -0.5,
            riskLevel: 0,
            order: 1,
          },
          {
            segmentId: "seg-farmacia-bus",
            name: "Farmacia a parada de bus",
            surfaceType: "paved",
            elevationChange: 0,
            riskLevel: 0,
            order: 2,
          },
          {
            segmentId: "seg-bus-metro",
            name: "Parada de bus a Metro",
            surfaceType: "paved",
            elevationChange: -2.3,
            riskLevel: 1,
            order: 3,
          },
        ],
      },
    },
    include: {
      waypoints: true,
      segments: true,
    },
  });

  console.log(`Seed complete: route "${route.name}" with ${route.waypoints.length} waypoints and ${route.segments.length} segments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
