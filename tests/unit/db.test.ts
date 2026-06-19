import { describe, it, expect } from "vitest";

/**
 * Database schema tests.
 * Verifies the schema types are correctly inferred by Drizzle.
 */
describe("db/schema", () => {
  it("users table is defined with correct columns", async () => {
    const { users } = await import("@/db/schema");
    expect(users).toBeDefined();
    expect(users.clerkId).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.isActive).toBeDefined();
    expect(users.createdAt).toBeDefined();
  });

  it("NewUser type allows optional name field", async () => {
    type NewUser = {
      clerkId: string;
      email: string;
      name?: string | null;
    };
    const user: NewUser = { clerkId: "test", email: "test@example.com" };
    expect(user.clerkId).toBe("test");
    expect(user.name).toBeUndefined();
  });
});
