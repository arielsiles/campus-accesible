// FR-004: Tests for location service
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestLocationPermission,
  checkLocationPermission,
} from "./locationService";

// Mock expo-location
vi.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(),
  Accuracy: { High: 6 },
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
}));

import * as Location from "expo-location";

const mockRequestPerms = vi.mocked(
  Location.requestForegroundPermissionsAsync
);
const mockGetPerms = vi.mocked(Location.getForegroundPermissionsAsync);

describe("locationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestLocationPermission", () => {
    it("returns 'granted' when permission is granted [FR-004]", async () => {
      mockRequestPerms.mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
        granted: true,
        expires: "never",
        canAskAgain: true,
      });

      const result = await requestLocationPermission();
      expect(result).toBe("granted");
    });

    it("returns 'denied' when permission is denied [FR-004]", async () => {
      mockRequestPerms.mockResolvedValue({
        status: Location.PermissionStatus.DENIED,
        granted: false,
        expires: "never",
        canAskAgain: true,
      });

      const result = await requestLocationPermission();
      expect(result).toBe("denied");
    });
  });

  describe("checkLocationPermission", () => {
    it("returns current permission status [FR-004]", async () => {
      mockGetPerms.mockResolvedValue({
        status: Location.PermissionStatus.GRANTED,
        granted: true,
        expires: "never",
        canAskAgain: true,
      });

      const result = await checkLocationPermission();
      expect(result).toBe("granted");
    });

    it("returns 'denied' when not yet granted [FR-004]", async () => {
      mockGetPerms.mockResolvedValue({
        status: Location.PermissionStatus.UNDETERMINED,
        granted: false,
        expires: "never",
        canAskAgain: true,
      });

      const result = await checkLocationPermission();
      expect(result).toBe("denied");
    });
  });
});
