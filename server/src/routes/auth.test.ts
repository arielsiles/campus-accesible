// FR-901: Auth route tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("POST /api/auth/register [FR-901]", () => {
  it("returns 400 for invalid email [FR-901]", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "test123",
        name: "Test",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for short password [FR-901]", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "12345",
        name: "Test",
      }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing name [FR-901]", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "test123",
        name: "",
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login [FR-901]", () => {
  it("returns 400 for invalid email [FR-901]", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bad-email",
        password: "test123",
      }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for empty password [FR-901]", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "",
      }),
    });

    expect(res.status).toBe(400);
  });
});
