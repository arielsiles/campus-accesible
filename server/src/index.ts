// FR-007: Hono server entry point
import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, hostname: "0.0.0.0", port }, (info) => {
  console.log(`Server running on http://0.0.0.0:${info.port}`);
  console.log(`Public access: http://181.177.190.92:${info.port}`);
});

export default app;
