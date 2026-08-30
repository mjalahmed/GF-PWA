export type EnvironmentName = "development" | "staging" | "production";

export type ServerEnvironment = {
  supabaseUrl: string;
  publishableKey: string;
  secretKey: string;
  appEnv: EnvironmentName;
  allowedOrigins: string[];
  logLevel: "debug" | "info" | "warn" | "error";
  port: number;
  apiRootPath: string;
  databaseUrl?: string;
};

const VALID_APP_ENVS = new Set<EnvironmentName>([
  "development",
  "staging",
  "production",
]);

function firstDefined(...names: string[]): string | undefined {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value && value.trim() !== "") return value.trim();
  }
  return undefined;
}

function required(...names: string[]): string {
  const value = firstDefined(...names);
  if (!value) {
    throw new Error(`Missing required environment variable: ${names.join(" | ")}`);
  }
  return value;
}

function parseAppEnv(raw: string | undefined): EnvironmentName {
  const value = (raw ?? "development").trim() as EnvironmentName;
  if (!VALID_APP_ENVS.has(value)) {
    throw new Error(
      `Invalid APP_ENV '${raw}'. Expected one of: development, staging, production.`,
    );
  }
  return value;
}

function parsePort(): number {
  const raw = Deno.env.get("PORT") ?? "8080";
  const port = Number.parseInt(raw, 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT '${raw}'. Expected integer 1-65535.`);
  }
  return port;
}

/**
 * Edge runtimes auto-inject SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
 * Standalone Railway deployment uses the same variables from Railway secrets.
 */
export function loadEnvironment(): ServerEnvironment {
  const appEnv = parseAppEnv(Deno.env.get("APP_ENV"));
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("CORS_ORIGIN") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (
    (appEnv === "production" || appEnv === "staging") &&
    allowed.length === 0
  ) {
    throw new Error(
      `ALLOWED_ORIGINS (or CORS_ORIGIN) is required when APP_ENV=${appEnv}. ` +
        "Set an explicit comma-separated allowlist (do not rely on localhost defaults).",
    );
  }

  const defaultOrigins = appEnv === "development"
    ? ["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:3000", "http://localhost:3000"]
    : [];

  return {
    supabaseUrl: required("SUPABASE_URL"),
    publishableKey: required(
      "SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
    ),
    secretKey: required(
      "SUPABASE_SECRET_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    appEnv,
    allowedOrigins: allowed.length > 0 ? allowed : defaultOrigins,
    logLevel: (Deno.env.get("LOG_LEVEL") as ServerEnvironment["logLevel"]) ??
      "info",
    port: parsePort(),
    apiRootPath: Deno.env.get("API_ROOT_PATH") ?? "",
    databaseUrl: firstDefined("DATABASE_URL", "POSTGRES_URL"),
  };
}
