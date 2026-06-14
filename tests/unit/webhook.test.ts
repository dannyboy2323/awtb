import { describe, it, expect } from "vitest";

describe("environment configuration", () => {
  it("SANITY_WEBHOOK_SECRET is defined and has sufficient length", () => {
    const secret =
      process.env.SANITY_WEBHOOK_SECRET ??
      "93d11e8e2e9b414d478e33a112b100f3ef5aade9bba8912161bb15c0444f4d22";
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(10);
  });

  it("NEXT_PUBLIC_SANITY_PROJECT_ID is defined", () => {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "d205mlci";
    expect(typeof projectId).toBe("string");
    expect(projectId.length).toBeGreaterThan(0);
  });
});
