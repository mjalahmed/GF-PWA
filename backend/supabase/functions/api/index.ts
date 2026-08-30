import { app } from "../_shared/app.ts";

Deno.serve(app.fetch);
