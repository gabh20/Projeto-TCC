import type {FastifyInstance} from "fastify";
import {UserController} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const userController = new UserController();

export async function userRoutes(app: FastifyInstance) {
    app.get("/users", { preHandler: authenticate }, userController.listUsers.bind(userController));
    app.get<{ Params: { id: string } }>(
        "/users/:id",
        { preHandler: authenticate },
        userController.getUserById.bind(userController),
    );
    app.patch<{ Params: { id: string } }>(
        "/users/:id",
        { preHandler: authenticate },
        userController.updateUser.bind(userController),
    );
    app.delete<{ Params: { id: string } }>(
        "/users/:id",
        { preHandler: authenticate },
        userController.deleteUser.bind(userController),
    );
}
