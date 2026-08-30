type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): LogLevel {
  return (Deno.env.get("LOG_LEVEL") as LogLevel) ?? "info";
}

function write(level: LogLevel, fields: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel()]) return;
  const safe = { ...fields };
  for (const key of Object.keys(safe)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("password") ||
      lower.includes("token") ||
      lower.includes("secret") ||
      lower.includes("authorization") ||
      lower.includes("jwt") ||
      lower.includes("cvv")
    ) {
      safe[key] = "[redacted]";
    }
  }
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...safe,
  }));
}

export const logger = {
  debug: (fields: Record<string, unknown>) => write("debug", fields),
  info: (fields: Record<string, unknown>) => write("info", fields),
  warn: (fields: Record<string, unknown>) => write("warn", fields),
  error: (fields: Record<string, unknown>) => write("error", fields),
};
