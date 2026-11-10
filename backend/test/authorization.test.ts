import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { signJwt } from "../src/lib/jwt.js";
import { userRoutes } from "../src/routes/user.routes.js";

test("um usuario nao pode alterar ou excluir o cadastro de outro", async () => {
    const app = Fastify();
    await app.register(userRoutes);

    try {
        const token = signJwt({ sub: 1, email: "usuario1@example.com", name: "Usuario 1" });
        const headers = { authorization: `Bearer ${token}` };

        const update = await app.inject({
            method: "PATCH",
            url: "/users/2",
            headers,
            payload: { name: "Nome alterado" },
        });
        assert.equal(update.statusCode, 403);

        const removal = await app.inject({
            method: "DELETE",
            url: "/users/2",
            headers,
        });
        assert.equal(removal.statusCode, 403);
    } finally {
        await app.close();
    }
});
