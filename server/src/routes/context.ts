// FR-1202, FR-1203, FR-1204, FR-1205: Contextual info endpoints
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { fetchNearbyPlaces } from "../services/placesService";
import { fetchWeather } from "../services/weatherService";
import { fetchTransitInfo } from "../services/transitService";

const prisma = new PrismaClient();

export const contextRoutes = new Hono();

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

// FR-1202: GET /api/context/places?lat=...&lng=...&radius=500
contextRoutes.get("/context/places", async (c) => {
  const parsed = coordsSchema.safeParse({
    lat: c.req.query("lat"),
    lng: c.req.query("lng"),
  });
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "lat y lng requeridos" } },
      400
    );
  }
  const radius = Math.min(2000, Math.max(100, Number(c.req.query("radius") ?? "500")));
  const places = await fetchNearbyPlaces(parsed.data.lat, parsed.data.lng, radius);
  return c.json(places);
});

// FR-1203: GET /api/context/weather?lat=...&lng=...
contextRoutes.get("/context/weather", async (c) => {
  const parsed = coordsSchema.safeParse({
    lat: c.req.query("lat"),
    lng: c.req.query("lng"),
  });
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "lat y lng requeridos" } },
      400
    );
  }
  const data = await fetchWeather(parsed.data.lat, parsed.data.lng);
  if (!data) {
    return c.json(
      { error: { code: "WEATHER_UNAVAILABLE", message: "Sin datos de clima" } },
      503
    );
  }
  return c.json(data);
});

// FR-1204: GET /api/context/transit?lat=...&lng=...&waypointId=...
contextRoutes.get("/context/transit", async (c) => {
  const parsed = coordsSchema.safeParse({
    lat: c.req.query("lat"),
    lng: c.req.query("lng"),
  });
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "lat y lng requeridos" } },
      400
    );
  }

  // Try to find a transport_stop waypoint at this location to get static lines
  const waypointId = c.req.query("waypointId");
  let staticLines: string[] = [];
  if (waypointId) {
    const waypoint = await prisma.waypoint.findUnique({
      where: { waypointId },
    });
    if (waypoint?.transportLines && waypoint.transportLines.length > 0) {
      staticLines = waypoint.transportLines;
    }
  }

  const data = await fetchTransitInfo(
    parsed.data.lat,
    parsed.data.lng,
    staticLines
  );
  return c.json(data);
});

// FR-1205: GET /api/context/all — combined endpoint for the panel
contextRoutes.get("/context/all", async (c) => {
  const parsed = coordsSchema.safeParse({
    lat: c.req.query("lat"),
    lng: c.req.query("lng"),
  });
  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "lat y lng requeridos" } },
      400
    );
  }

  const [places, weather] = await Promise.all([
    fetchNearbyPlaces(parsed.data.lat, parsed.data.lng).catch(() => []),
    fetchWeather(parsed.data.lat, parsed.data.lng).catch(() => null),
  ]);

  return c.json({
    places,
    weather,
    coordinates: { lat: parsed.data.lat, lng: parsed.data.lng },
    timestamp: new Date().toISOString(),
  });
});
