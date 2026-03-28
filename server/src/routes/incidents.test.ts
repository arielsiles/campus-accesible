// TST-FR-501, TST-FR-502: Incident CRUD endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

const validIncident = {
  deviceId: "test-device-001",
  type: "obras",
  title: "Obras en el camino",
  description: "Hay obras de reparacion que bloquean el paso peatonal",
  latitude: 40.4475,
  longitude: -3.7265,
  segmentId: "seg-medicina-odonto",
};

describe("POST /api/incidents [FR-501]", () => {
  it("creates incident with valid data [TST-FR-501-001]", async () => {
    const res = await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validIncident),
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.incident).toBeDefined();
    expect(body.incident.type).toBe("obras");
    expect(body.incident.status).toBe("pending");
    expect(body.incident.title).toBe("Obras en el camino");
    expect(body.incident.deviceId).toBe("test-device-001");
    expect(body.incident.segmentId).toBe("seg-medicina-odonto");
  });

  it("returns 400 for invalid body [TST-FR-501-002]", async () => {
    const res = await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invalid_type" }),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing JSON body [TST-FR-501-002]", async () => {
    const res = await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/incidents [FR-501]", () => {
  it("lists incidents with pagination [TST-FR-501-003]", async () => {
    const res = await app.request("/api/incidents");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.incidents).toBeDefined();
    expect(Array.isArray(body.incidents)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  it("filters incidents by status [TST-FR-501-003]", async () => {
    const res = await app.request("/api/incidents?status=pending");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.incidents).toBeDefined();
    for (const inc of body.incidents) {
      expect(inc.status).toBe("pending");
    }
  });
});

describe("GET /api/incidents/:id [FR-501]", () => {
  it("returns incident detail [TST-FR-501-004]", async () => {
    // First create an incident to get its ID
    const createRes = await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validIncident,
        deviceId: "test-device-detail",
      }),
    });
    const created = await createRes.json();
    const id = created.incident.id;

    const res = await app.request(`/api/incidents/${id}`);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.incident.id).toBe(id);
    expect(body.incident.deviceId).toBe("test-device-detail");
  });

  it("returns 404 for non-existing incident [TST-FR-501-005]", async () => {
    const res = await app.request("/api/incidents/non-existing-id");

    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("PATCH /api/incidents/:id/status [FR-501]", () => {
  it("updates incident status [TST-FR-501-006]", async () => {
    // Create incident first
    const createRes = await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validIncident,
        deviceId: "test-device-patch",
      }),
    });
    const created = await createRes.json();
    const id = created.incident.id;

    const res = await app.request(`/api/incidents/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "validated" }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.incident.status).toBe("validated");
  });

  it("sets resolvedAt when status is resolved [FR-501]", async () => {
    const createRes = await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validIncident,
        deviceId: "test-device-resolve",
      }),
    });
    const created = await createRes.json();
    const id = created.incident.id;

    const res = await app.request(`/api/incidents/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.incident.status).toBe("resolved");
    expect(body.incident.resolvedAt).not.toBeNull();
  });
});

describe("GET /api/incidents/near [FR-502]", () => {
  it("returns nearby incidents within radius [TST-FR-502-001]", async () => {
    // Create an incident at known location
    await app.request("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validIncident,
        deviceId: "test-device-near",
      }),
    });

    const res = await app.request(
      "/api/incidents/near?lat=40.4475&lng=-3.7265&radius=500"
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.incidents).toBeDefined();
    expect(Array.isArray(body.incidents)).toBe(true);
  });

  it("returns 400 for missing coordinates [FR-502]", async () => {
    const res = await app.request("/api/incidents/near");

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
