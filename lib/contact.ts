import { z } from "zod";
import { contactTopics } from "@/lib/contact-topics";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  topic: z.enum(contactTopics),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal("true"),
  website: z.string().max(0).optional(),
});
