import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { HttpError } from "../errors/http-error.js";
import { updateUserSchema, userIdParamsSchema } from "../schemas/user.schema.js";
import {UserService} from "../services/user.service.js";

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

export class UserController {
    async listUsers(request: FastifyRequest, reply: FastifyReply) {
        const users = await userService.findAll();
        return reply.status(200).send(users);
    }

    async getUserById(
        request: FastifyRequest<{
            Params: {
                id: string;
            };
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = userIdParamsSchema.parse(request.params);
            const user = await userService.findById(id);

            return reply.status(200).send(user);
        } catch (error) {
            return handleControllerError(error, reply);
        }
    }

    async updateUser(
        request: FastifyRequest<{
            Params: {
                id: string;
            };
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = userIdParamsSchema.parse(request.params);
            const data = updateUserSchema.parse(request.body);
            if (request.user?.sub !== id) {
                return reply.status(403).send({ message: "Você só pode alterar seu próprio cadastro" });
            }
            const user = await userService.update(id, data);

            return reply.status(200).send(user);
        } catch (error) {
            return handleControllerError(error, reply);
        }
    }

    async deleteUser(
        request: FastifyRequest<{
            Params: {
                id: string;
            };
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = userIdParamsSchema.parse(request.params);
            if (request.user?.sub !== id) {
                return reply.status(403).send({ message: "Você só pode excluir seu próprio cadastro" });
            }
            await userService.delete(id);

            return reply.status(204).send();
        } catch (error) {
            return handleControllerError(error, reply);
        }
    }
}
