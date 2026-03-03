import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env file manually (no dotenv dependency)
function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}

loadEnvFile();

const isProd = process.env.NODE_ENV === "production";

function required(name) {
  const val = process.env[name];
  if (!val) {
    if (isProd) {
      throw new Error(`Missing required env var: ${name}`);
    }
    console.warn(`⚠ Missing env var: ${name} (required in production)`);
  }
  return val || "";
}

function optional(name, fallback = "") {
  return process.env[name] || fallback;
}

export const config = {
  port: parseInt(optional("PORT", "3001"), 10),
  databaseUrl: required("DATABASE_URL"),
  encryptionKey: required("ENCRYPTION_KEY"),
  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
  nodeEnv: optional("NODE_ENV", "development"),
  isProd,
};
