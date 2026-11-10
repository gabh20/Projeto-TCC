import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { HttpError } from "../errors/http-error.js";
import { createUserSchema, loginSchema } from "../schemas/user.schema.js";
import { AuthService } from "../services/auth.service.js";
import { UserService } from "../services/user.service.js";

const authService = new AuthService();
const userService = new UserService();

function handleControllerError(error: unknown, reply: FastifyReply) {
    if (error instanceof ZodError) {
        return reply.status(400).send({
            message: "Dados inválidos",
            errors: error.issues.map((issue) => issue.message),
        });
    }

    if (error instanceof HttpError) {
        return reply.status(error.statusCode).send({ message: error.message });
    }

    throw error;
}

export class AuthController {
    async register(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = createUserSchema.parse(request.body);
            const result = await authService.register(data);

            return reply.status(201).send(result);
        } catch (error) {
            return handleControllerError(error, reply);
        }
    }

    async login(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = loginSchema.parse(request.body);
            const result = await authService.login(data);

            return reply.status(200).send(result);
        } catch (error) {
            return handleControllerError(error, reply);
        }
    }

    async me(request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
            return reply.status(401).send({ message: "Token não informado" });
        }

        try {
            const user = await userService.findById(request.user.sub);
            return reply.status(200).send(user);
        } catch (error) {
            return handleControllerError(error, reply);
        }
    }
}
