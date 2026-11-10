import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { authRoutes } from "./routes/auth.routes.js";
import { userRoutes } from "./routes/user.routes.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? (process.env.NODE_ENV === "production" ? false : true),
});

await app.register(authRoutes);
await app.register(userRoutes);

app.get("/", async () => {
  return { message: "API rodando com Fastify" };
});

const port = Number(process.env.PORT) || 3333;

await app.listen({
  port,
  host: "0.0.0.0",
});
