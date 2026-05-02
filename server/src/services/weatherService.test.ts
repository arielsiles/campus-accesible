// FR-1203: Weather alerts tests
import { describe, it, expect } from "vitest";
import { deriveAlerts } from "./weatherService";

describe("deriveAlerts [FR-1203]", () => {
  it("no alerts on clear mild day", () => {
    expect(
      deriveAlerts({ temperature: 20, condition: "Clear", windSpeed: 3 })
    ).toEqual([]);
  });

  it("rain produces warning", () => {
    const alerts = deriveAlerts({
      temperature: 18,
      condition: "Rain",
      windSpeed: 2,
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("warning");
    expect(alerts[0].message).toContain("resbaladizo");
  });

  it("snow produces danger", () => {
    const alerts = deriveAlerts({
      temperature: -2,
      condition: "Snow",
      windSpeed: 5,
    });
    // snow + cold temperature
    expect(alerts.some((a) => a.severity === "danger")).toBe(true);
  });

  it("extreme heat produces warning", () => {
    const alerts = deriveAlerts({
      temperature: 38,
      condition: "Clear",
      windSpeed: 1,
    });
    expect(alerts.some((a) => a.message.includes("Calor"))).toBe(true);
  });

  it("strong wind produces alert", () => {
    const alerts = deriveAlerts({
      temperature: 20,
      condition: "Clouds",
      windSpeed: 18,
    });
    expect(alerts.some((a) => a.message.includes("Viento"))).toBe(true);
  });

  it("multiple conditions stack alerts", () => {
    const alerts = deriveAlerts({
      temperature: 0,
      condition: "Rain",
      windSpeed: 16,
    });
    expect(alerts.length).toBeGreaterThanOrEqual(3);
  });
});
