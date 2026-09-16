import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/contact";
import { contactTopics } from "@/lib/contact-topics";

const valid = {
  name: "Nimal",
  email: "nimal@example.com",
  topic: "Order support",
  message: "Where is my order right now?",
  consent: "true",
  website: "",
};

describe("contact form contract", () => {
  it("offers store-focused topics only", () => {
    expect(contactTopics).toEqual(["General inquiry", "Order support", "Business inquiry"]);
  });

  it("accepts a valid store inquiry", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects the retired sponsorship topic", () => {
    expect(contactSchema.safeParse({ ...valid, topic: "Sponsorship" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false);
  });

  it("rejects submissions without consent", () => {
    expect(contactSchema.safeParse({ ...valid, consent: "false" }).success).toBe(false);
  });
});
