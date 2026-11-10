import type { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
    app.post("/auth/register", authController.register.bind(authController));
    app.post("/auth/login", authController.login.bind(authController));
    app.get("/auth/me", { preHandler: authenticate }, authController.me.bind(authController));
}
