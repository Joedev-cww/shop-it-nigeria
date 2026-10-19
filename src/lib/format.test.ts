import { describe, expect, it } from "vitest";
import { containsContactInfo, deliveryIsExpensive, naira } from "./format";

describe("naira", () => {
  it("formats with the ₦ sign and thousands separator", () => {
    expect(naira(2500)).toBe("₦2,500");
  });
});

describe("contact blocking", () => {
  it("blocks spaced phone numbers", () => expect(containsContactInfo("call 0803 123 4567")).toBe(true));
  it("blocks dashed phone numbers", () => expect(containsContactInfo("0803-123-4567")).toBe(true));
  it("blocks spelled-out numbers", () =>
    expect(containsContactInfo("zero eight zero three one two three")).toBe(true));
  it("blocks WhatsApp mentions", () => expect(containsContactInfo("message me on WhatsApp")).toBe(true));
  it("blocks @handles", () => expect(containsContactInfo("follow @ada_beads")).toBe(true));
  it("blocks emails", () => expect(containsContactInfo("ada@gmail.com")).toBe(true));
  it("allows normal descriptions", () =>
    expect(containsContactInfo("Three strands, 2 colours, fits 28-34 inch waist")).toBe(false));
});

describe("delivery warning", () => {
  it("warns when delivery is over 50% of item price", () => expect(deliveryIsExpensive(1000, 600)).toBe(true));
  it("does not warn at exactly 50%", () => expect(deliveryIsExpensive(1000, 500)).toBe(false));
});
