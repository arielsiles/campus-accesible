// FR-008, FR-201, FR-205, FR-901, FR-902: Seed script
// Test routes with graph, transport data, users, and campus
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { buildGraph } from "../src/services/graphBuilder";

const prisma = new PrismaClient();

// Waypoint coordinates [lng, lat]
const coords = {
  medicina: [-3.7267, 40.4489],
  odontologia: [-3.7258, 40.4479],
  farmacia: [-3.7271, 40.4471],
  busFarmacia: [-3.7275, 40.4465],
  metroCU: [-3.7302, 40.4449],
  derecho: [-3.7285, 40.4495],
  filosofia: [-3.7290, 40.4480],
  informatica: [-3.7230, 40.4510],
  matematicas: [-3.7240, 40.4500],
  fisicas: [-3.7250, 40.4492],
};

async function main() {
  // Clean existing data (order matters for FK constraints)
  await prisma.routeReview.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.graphEdge.deleteMany();
  await prisma.routeSegment.deleteMany();
  await prisma.waypoint.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();
  await prisma.campus.deleteMany();

  // FR-901: Seed admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.create({
    data: {
      id: "seed-admin",
      email: "admin@campusgps.dev",
      password: adminPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  // FR-902: Seed default campus
  const campusCU = await prisma.campus.create({
    data: {
      id: "campus-cu",
      name: "Ciudad Universitaria (UCM)",
      description: "Campus principal de la Universidad Complutense de Madrid",
      centerLng: -3.7264,
      centerLat: 40.4468,
      boundingBox: { minLng: -3.74, minLat: 40.44, maxLng: -3.72, maxLat: 40.46 },
    },
  });

  // === Route 1: Medicina → Metro CU (existing from Fase 1) ===
  const route1 = await prisma.route.create({
    data: {
      id: "test-route-1",
      name: "Medicina → Metro Ciudad Universitaria",
      description:
        "Ruta accesible desde la Facultad de Medicina hasta la estación de Metro Ciudad Universitaria",
      status: "published",
      campusId: campusCU.id,
      creatorId: adminUser.id,
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
            // FR-205: Transport stop with lines
            waypointId: "wp-bus-farmacia",
            name: "Parada de bus Farmacia",
            description: "Parada de autobús frente a Farmacia, líneas G y U",
            waypointType: "transport_stop",
            transportType: "bus",
            transportLines: ["G", "U"],
            latitude: 40.4465,
            longitude: -3.7275,
            orderIndex: 3,
          },
          {
            // FR-205: Transport stop with lines
            waypointId: "wp-metro-cu",
            name: "Metro Ciudad Universitaria",
            description:
              "Estación de Metro Ciudad Universitaria, línea 6 (circular)",
            waypointType: "transport_stop",
            transportType: "metro",
            transportLines: ["6"],
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
            riskDescription: null,
            riskFactors: [],
            audioDescription: "Camino pavimentado con ligero descenso hacia Odontología",
            // FR-401: Physical accessibility
            hasRamp: true,
            hasStairs: false,
            pathWidth: 2.5,
            maxSlope: 3.2,
            surfaceQuality: "good",
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
            riskLevel: "low",
            riskDescription: "Superficie irregular en tramo central",
            riskFactors: ["superficie_irregular"],
            audioDescription: "Tramo pavimentado con zona de adoquinado irregular en el centro",
            // FR-401: Physical accessibility
            hasRamp: false,
            hasStairs: false,
            pathWidth: 2.0,
            maxSlope: 1.5,
            surfaceQuality: "fair",
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
            riskDescription: null,
            riskFactors: [],
            audioDescription: "Camino llano y pavimentado hasta la parada de bus",
            // FR-401: Physical accessibility
            hasRamp: true,
            hasStairs: false,
            pathWidth: 3.0,
            maxSlope: 0.5,
            surfaceQuality: "good",
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
            riskLevel: "medium",
            riskDescription: "Cruce con tráfico moderado sin semáforo",
            riskFactors: ["cruce_sin_semaforo", "trafico_vehicular"],
            audioDescription: "Descenso hacia Metro. Precaución: cruce con tráfico sin semáforo",
            // FR-401: Physical accessibility — stairs at metro entrance
            hasRamp: false,
            hasStairs: true,
            pathWidth: 1.8,
            maxSlope: 6.5,
            surfaceQuality: "good",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.busFarmacia, coords.metroCU],
            }),
            orderIndex: 3,
          },
        ],
      },
    },
    include: { waypoints: true, segments: true },
  });

  // === Route 2: Derecho → Metro CU ===
  const route2 = await prisma.route.create({
    data: {
      id: "test-route-2",
      name: "Derecho → Metro Ciudad Universitaria",
      description:
        "Ruta accesible desde la Facultad de Derecho hasta Metro Ciudad Universitaria",
      status: "published",
      campusId: campusCU.id,
      creatorId: adminUser.id,
      waypoints: {
        create: [
          {
            waypointId: "wp-derecho",
            name: "Facultad de Derecho",
            description: "Entrada principal de la Facultad de Derecho (UCM)",
            waypointType: "building",
            latitude: 40.4495,
            longitude: -3.7285,
            orderIndex: 0,
          },
          {
            waypointId: "wp-filosofia",
            name: "Facultad de Filosofía",
            description: "Cruce frente a la Facultad de Filosofía y Letras",
            waypointType: "intersection",
            latitude: 40.4480,
            longitude: -3.7290,
            orderIndex: 1,
          },
          {
            // Shared location with route 1 (bus stop)
            waypointId: "wp-bus-farmacia-r2",
            name: "Parada de bus Farmacia",
            description: "Parada de autobús frente a Farmacia, líneas G y U",
            waypointType: "transport_stop",
            transportType: "bus",
            transportLines: ["G", "U"],
            latitude: 40.4465,
            longitude: -3.7275,
            orderIndex: 2,
          },
          {
            // Shared location with route 1 (metro)
            waypointId: "wp-metro-cu-r2",
            name: "Metro Ciudad Universitaria",
            description:
              "Estación de Metro Ciudad Universitaria, línea 6 (circular)",
            waypointType: "transport_stop",
            transportType: "metro",
            transportLines: ["6"],
            latitude: 40.4449,
            longitude: -3.7302,
            orderIndex: 3,
          },
        ],
      },
      segments: {
        create: [
          {
            segmentId: "seg-derecho-filosofia",
            name: "Derecho a Filosofía",
            surfaceType: "paved",
            elevationChange: -0.8,
            riskLevel: "none",
            riskDescription: null,
            riskFactors: [],
            audioDescription: "Camino pavimentado con ligero descenso hacia Filosofía",
            // FR-401: Physical accessibility
            hasRamp: true,
            hasStairs: false,
            pathWidth: 2.2,
            maxSlope: 2.0,
            surfaceQuality: "good",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.derecho, coords.filosofia],
            }),
            orderIndex: 0,
          },
          {
            segmentId: "seg-filosofia-bus",
            name: "Filosofía a parada de bus",
            surfaceType: "cobblestone",
            elevationChange: -1.0,
            riskLevel: "low",
            riskDescription: "Adoquinado con poca iluminación nocturna",
            riskFactors: ["superficie_irregular", "mala_iluminacion"],
            audioDescription: "Adoquinado con cuesta descendente. Poca iluminación por la noche",
            // FR-401: Physical accessibility — narrow cobblestone path
            hasRamp: false,
            hasStairs: false,
            pathWidth: 1.2,
            maxSlope: 4.0,
            surfaceQuality: "poor",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.filosofia, coords.busFarmacia],
            }),
            orderIndex: 1,
          },
          {
            segmentId: "seg-bus-metro-r2",
            name: "Parada de bus a Metro (vía Derecho)",
            surfaceType: "paved",
            elevationChange: -2.3,
            riskLevel: "medium",
            riskDescription: "Cruce con tráfico moderado sin semáforo",
            riskFactors: ["cruce_sin_semaforo", "trafico_vehicular"],
            audioDescription: "Descenso hacia Metro. Precaución: cruce con tráfico sin semáforo",
            // FR-401: Physical accessibility — stairs at metro
            hasRamp: false,
            hasStairs: true,
            pathWidth: 1.8,
            maxSlope: 6.5,
            surfaceQuality: "good",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.busFarmacia, coords.metroCU],
            }),
            orderIndex: 2,
          },
        ],
      },
    },
    include: { waypoints: true, segments: true },
  });

  // === Route 3: Informática → Medicina ===
  const route3 = await prisma.route.create({
    data: {
      id: "test-route-3",
      name: "Informática → Medicina",
      description:
        "Ruta accesible desde la Facultad de Informática hasta Medicina",
      status: "published",
      campusId: campusCU.id,
      creatorId: adminUser.id,
      waypoints: {
        create: [
          {
            waypointId: "wp-informatica",
            name: "Facultad de Informática",
            description:
              "Entrada principal de la Facultad de Informática (UCM)",
            waypointType: "building",
            latitude: 40.451,
            longitude: -3.723,
            orderIndex: 0,
          },
          {
            waypointId: "wp-matematicas",
            name: "Facultad de Matemáticas",
            description: "Cruce frente a la Facultad de Matemáticas",
            waypointType: "intersection",
            latitude: 40.45,
            longitude: -3.724,
            orderIndex: 1,
          },
          {
            waypointId: "wp-fisicas",
            name: "Facultad de Físicas",
            description: "Entrada de la Facultad de Ciencias Físicas",
            waypointType: "building",
            latitude: 40.4492,
            longitude: -3.725,
            orderIndex: 2,
          },
          {
            // Shared with route 1 — same physical location
            waypointId: "wp-odontologia-r3",
            name: "Facultad de Odontología",
            description: "Cruce frente a la Facultad de Odontología",
            waypointType: "intersection",
            latitude: 40.4479,
            longitude: -3.7258,
            orderIndex: 3,
          },
          {
            // Shared with route 1 — same physical location
            waypointId: "wp-medicina-r3",
            name: "Facultad de Medicina",
            description: "Entrada principal de la Facultad de Medicina (UCM)",
            waypointType: "building",
            latitude: 40.4489,
            longitude: -3.7267,
            orderIndex: 4,
          },
        ],
      },
      segments: {
        create: [
          {
            segmentId: "seg-info-mates",
            name: "Informática a Matemáticas",
            surfaceType: "paved",
            elevationChange: -0.5,
            riskLevel: "none",
            riskDescription: null,
            riskFactors: [],
            audioDescription: "Camino pavimentado con ligero descenso",
            // FR-401: Physical accessibility
            hasRamp: true,
            hasStairs: false,
            pathWidth: 2.8,
            maxSlope: 1.5,
            surfaceQuality: "good",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.informatica, coords.matematicas],
            }),
            orderIndex: 0,
          },
          {
            segmentId: "seg-mates-fisicas",
            name: "Matemáticas a Físicas",
            surfaceType: "paved",
            elevationChange: -0.3,
            riskLevel: "none",
            riskDescription: null,
            riskFactors: [],
            audioDescription: "Tramo llano y pavimentado entre facultades",
            // FR-401: Physical accessibility
            hasRamp: false,
            hasStairs: false,
            pathWidth: 2.0,
            maxSlope: 0.8,
            surfaceQuality: "good",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.matematicas, coords.fisicas],
            }),
            orderIndex: 1,
          },
          {
            segmentId: "seg-fisicas-odonto",
            name: "Físicas a Odontología",
            surfaceType: "gravel",
            elevationChange: -1.0,
            riskLevel: "medium",
            riskDescription: "Grava suelta con pendiente descendente",
            riskFactors: ["superficie_irregular", "pendiente_pronunciada"],
            audioDescription: "Camino de grava con cuesta descendente. Precaución: superficie irregular",
            // FR-401: Physical accessibility — steep gravel with stairs
            hasRamp: false,
            hasStairs: true,
            pathWidth: 1.3,
            maxSlope: 9.5,
            surfaceQuality: "poor",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.fisicas, coords.odontologia],
            }),
            orderIndex: 2,
          },
          {
            segmentId: "seg-odonto-medicina",
            name: "Odontología a Medicina",
            surfaceType: "paved",
            elevationChange: 1.2,
            riskLevel: "none",
            riskDescription: null,
            riskFactors: [],
            audioDescription: "Subida suave pavimentada hacia Medicina",
            // FR-401: Physical accessibility
            hasRamp: true,
            hasStairs: false,
            pathWidth: 2.5,
            maxSlope: 3.2,
            surfaceQuality: "good",
            geometryGeoJson: JSON.stringify({
              type: "LineString",
              coordinates: [coords.odontologia, coords.medicina],
            }),
            orderIndex: 3,
          },
        ],
      },
    },
    include: { waypoints: true, segments: true },
  });

  // FR-201: Build route graph from all routes
  const graphResult = await buildGraph(prisma);

  // FR-501: Seed sample incidents — lookup segment IDs by segmentId
  const segOdontoFarmacia = await prisma.routeSegment.findUnique({ where: { segmentId: "seg-odonto-farmacia" } });
  const segBusMetro = await prisma.routeSegment.findUnique({ where: { segmentId: "seg-bus-metro" } });
  const segMatesFisicas = await prisma.routeSegment.findUnique({ where: { segmentId: "seg-mates-fisicas" } });

  const incident1 = await prisma.incident.create({
    data: {
      deviceId: "seed-device-001",
      type: "obras",
      status: "validated",
      title: "Obras en acera de Odontología",
      description: "Obras de reparación de acera que obligan a caminar por la calzada",
      latitude: 40.4479,
      longitude: -3.7258,
      segmentId: segOdontoFarmacia?.id ?? null,
      aiValidation: true,
      aiConfidence: 0.92,
      aiReason: "Ubicación válida en campus, descripción coherente con tipo 'obras'",
      validationSource: "ai",
    },
  });

  const incident2 = await prisma.incident.create({
    data: {
      deviceId: "seed-device-002",
      type: "ascensor_averiado",
      status: "pending",
      title: "Ascensor Metro CU averiado",
      description: "El ascensor de la estación de Metro Ciudad Universitaria no funciona desde esta mañana",
      latitude: 40.4449,
      longitude: -3.7302,
      segmentId: segBusMetro?.id ?? null,
      aiValidation: true,
      aiConfidence: 0.85,
      aiReason: "Incidencia plausible, ubicación cercana a Metro CU",
      validationSource: "ai",
    },
  });

  const incident3 = await prisma.incident.create({
    data: {
      deviceId: "seed-device-003",
      type: "superficie_danada",
      status: "resolved",
      title: "Baldosas sueltas en Físicas",
      description: "Varias baldosas sueltas en el camino entre Matemáticas y Físicas, riesgo de tropiezo",
      latitude: 40.4496,
      longitude: -3.7245,
      segmentId: segMatesFisicas?.id ?? null,
      aiValidation: true,
      aiConfidence: 0.78,
      aiReason: "Descripción coherente con superficie dañada en zona conocida",
      validationSource: "ai",
      resolvedAt: new Date("2026-03-25"),
    },
  });

  console.log(
    `Seed complete:\n` +
      `  Campus: "${campusCU.name}"\n` +
      `  Admin: ${adminUser.email} (password: admin123)\n` +
      `  Route 1: "${route1.name}" — ${route1.waypoints.length} waypoints, ${route1.segments.length} segments\n` +
      `  Route 2: "${route2.name}" — ${route2.waypoints.length} waypoints, ${route2.segments.length} segments\n` +
      `  Route 3: "${route3.name}" — ${route3.waypoints.length} waypoints, ${route3.segments.length} segments\n` +
      `  Graph: ${graphResult.nodesCount} nodes, ${graphResult.edgesCount} edges\n` +
      `  Incidents: 3 (1 validated, 1 pending, 1 resolved)`
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
