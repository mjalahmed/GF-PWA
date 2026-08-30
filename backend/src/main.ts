/**
 * Standalone GarageFinder API server for Railway / container deployment.
 * Binds to 0.0.0.0:$PORT with graceful shutdown on SIGTERM/SIGINT.
 */
import { app } from "../supabase/functions/_shared/app.ts";
import { loadEnvironment } from "../supabase/functions/_shared/core/config/environment.ts";
import { logger } from "../supabase/functions/_shared/core/logging/logger.ts";

const env = loadEnvironment();
const port = env.port;
const hostname = "0.0.0.0";

logger.info({
  event: "startup",
  message: "GarageFinder API starting",
  appEnv: env.appEnv,
  port,
  hostname,
  apiRootPath: env.apiRootPath,
});

const server = Deno.serve(
  { port, hostname, onListen: ({ port: p }) => logger.info({ event: "listening", port: p, hostname }) },
  app.fetch,
);

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ event: "shutdown", signal, message: "Graceful shutdown initiated" });
  try {
    await server.shutdown();
    logger.info({ event: "shutdown", message: "Server closed" });
  } catch (err) {
    logger.error({ event: "shutdown", message: "Error during shutdown", error: String(err) });
  } finally {
    Deno.exit(0);
  }
}

Deno.addSignalListener("SIGTERM", () => shutdown("SIGTERM"));
Deno.addSignalListener("SIGINT", () => shutdown("SIGINT"));
