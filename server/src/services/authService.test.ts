// FR-901: Auth service tests
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "./authService";

describe("authService", () => {
  describe("hashPassword / comparePassword", () => {
    it("hashes and verifies a password [FR-901]", async () => {
      const hash = await hashPassword("test123");
      expect(hash).not.toBe("test123");
      expect(await comparePassword("test123", hash)).toBe(true);
      expect(await comparePassword("wrong", hash)).toBe(false);
    });
  });

  describe("generateToken / verifyToken", () => {
    it("generates and verifies a JWT [FR-901]", async () => {
      const user = { id: "user-1", email: "test@test.com", role: "contributor" };
      const token = await generateToken(user);
      expect(typeof token).toBe("string");

      const payload = await verifyToken(token);
      expect(payload.sub).toBe("user-1");
      expect(payload.email).toBe("test@test.com");
      expect(payload.role).toBe("contributor");
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("rejects tampered tokens [FR-901]", async () => {
      await expect(verifyToken("invalid.token.here")).rejects.toThrow();
    });
  });
});
