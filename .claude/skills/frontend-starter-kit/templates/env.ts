// src/lib/env.ts: the only place that reads process.env.
// Missing or malformed values stop the app at startup instead of falling back to a guess.
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

// Each variable is referenced literally so Next.js can inline NEXT_PUBLIC_* values in the client bundle.
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
