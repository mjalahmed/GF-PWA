import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../core/types/context.ts";
import { ApiContract } from "./api-contract.ts";
import { openApiDocument } from "./openapi.ts";

export const openApiRoutes = new Hono<{ Variables: AppVariables }>();

openApiRoutes.get(ApiContract.routes.openApi, (c) => {
  return c.json(openApiDocument);
});

openApiRoutes.get(ApiContract.routes.docs, (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GarageFinder API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: './openapi.json',
      dom_id: '#swagger-ui',
    });
  </script>
</body>
</html>`;
  return c.html(html);
});
