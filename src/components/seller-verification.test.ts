import { describe, expect, it } from "vitest";
import { isMinor } from "./seller-verification";

describe("isMinor (guardian consent rule)", () => {
  const today = new Date(2026, 9, 21);
  it("17-year-old needs a guardian", () => expect(isMinor("2009-10-22", today)).toBe(true));
  it("exactly 18 today does not", () => expect(isMinor("2008-10-21", today)).toBe(false));
});
