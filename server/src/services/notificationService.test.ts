// TST-FR-505: Notification service tests
import { describe, it, expect } from "vitest";
import { isValidExpoPushToken } from "./notificationService";

describe("isValidExpoPushToken [FR-505]", () => {
  it("accepts valid ExponentPushToken format [TST-FR-505-001]", () => {
    expect(isValidExpoPushToken("ExponentPushToken[abc123]")).toBe(true);
  });

  it("accepts valid ExpoPushToken format [TST-FR-505-001]", () => {
    expect(isValidExpoPushToken("ExpoPushToken[xyz789]")).toBe(true);
  });

  it("rejects empty string [TST-FR-505-001]", () => {
    expect(isValidExpoPushToken("")).toBe(false);
  });

  it("rejects random string [TST-FR-505-001]", () => {
    expect(isValidExpoPushToken("random-token")).toBe(false);
  });

  it("rejects malformed token [TST-FR-505-001]", () => {
    expect(isValidExpoPushToken("ExponentPushToken")).toBe(false);
  });
});
