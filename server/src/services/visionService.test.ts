// FR-1102: Vision service tests
import { describe, it, expect } from "vitest";
import { VisionError } from "./visionService";

describe("VisionError", () => {
  it("includes code and message [FR-1102]", () => {
    const err = new VisionError("VISION_NO_API_KEY", "API key missing");
    expect(err.code).toBe("VISION_NO_API_KEY");
    expect(err.message).toBe("API key missing");
    expect(err.name).toBe("VisionError");
  });
});

// Note: Integration tests with the real Claude API are not run by default
// to avoid burning budget. Run them manually with ANTHROPIC_API_KEY set.
