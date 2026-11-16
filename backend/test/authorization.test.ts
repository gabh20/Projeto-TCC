import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signJwt } from "../src/lib/jwt.js";
import { userRoutes } from "../src/routes/user.routes.js";

describe("autorização das rotas de usuários", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = Fastify();
        await app.register(userRoutes);
    });

    afterEach(async () => {
        await app.close();
    });

    it("recusa requisições sem token", async () => {
        const response = await app.inject({ method: "GET", url: "/users" });

        expect(response.statusCode).toBe(401);
    });

    it("recusa requisições com token inválido", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/users",
            headers: { authorization: "Bearer token.invalido.123" },
        });

        expect(response.statusCode).toBe(401);
    });

    it("impede que um usuário altere ou exclua o cadastro de outro", async () => {
        const token = signJwt({ sub: 1, email: "usuario1@example.com", name: "Usuario 1" });
        const headers = { authorization: `Bearer ${token}` };

        const update = await app.inject({
            method: "PATCH",
            url: "/users/2",
            headers,
            payload: { name: "Nome alterado" },
        });
        expect(update.statusCode).toBe(403);

        const removal = await app.inject({
            method: "DELETE",
            url: "/users/2",
            headers,
        });
        expect(removal.statusCode).toBe(403);
    });
});
