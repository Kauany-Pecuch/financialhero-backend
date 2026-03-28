// src/tests/integration/User.integration.spec.ts
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestContainer } from "../TestContainer.js";

class UserIntegrationSpec extends TestContainer {}

beforeAll(async () => {
  await UserIntegrationSpec.setup();
}, 60_000);

afterAll(async () => {
  await UserIntegrationSpec.teardown();
});

describe("User integration", () => {
  it("deve ter DB configurado", () => {
    expect(process.env.DB_HOST).toBeDefined();
  });
});