import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyJwt, type AuthTokenPayload } from "../lib/jwt.js";

declare module "fastify" {
    interface FastifyRequest {
        user?: AuthTokenPayload;
    }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
        return reply.status(401).send({ message: "Token não informado" });
    }

    try {
        request.user = verifyJwt(token);
    } catch {
        return reply.status(401).send({ message: "Token inválido ou expirado" });
    }
}
