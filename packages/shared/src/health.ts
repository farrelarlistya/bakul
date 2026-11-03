import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("bakul-api"),
  database: z.literal("up"),
  version: z.string(),
  checkedAt: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
