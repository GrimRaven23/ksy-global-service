import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid PostgreSQL connection URL" }),
  DIRECT_URL: z.string().url({ message: "DIRECT_URL must be a valid PostgreSQL direct connection URL" }).optional(),
  SESSION_SECRET: z.string().min(32, { message: "SESSION_SECRET must be at least 32 characters" }),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, val]) => `  ${key}: ${val?.join(", ")}`)
      .join("\n");
    console.error("\n╔══════════════════════════════════════════╗");
    console.error("║  ENVIRONMENT CONFIGURATION ERROR         ║");
    console.error("╚══════════════════════════════════════════╝\n");
    console.error(messages);
    console.error("\nCheck your .env.local file.\n");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return null;
  }
  return parsed.data;
}

export const env = validateEnv();
