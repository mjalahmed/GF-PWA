import { openApiDocument } from "../../functions/_shared/contracts/openapi.ts";

const out = new URL("../../../docs/api/openapi.json", import.meta.url);
await Deno.mkdir(new URL("../../../docs/api/", import.meta.url), { recursive: true });
await Deno.writeTextFile(out, `${JSON.stringify(openApiDocument, null, 2)}\n`);
console.log(`Wrote ${out.pathname}`);
