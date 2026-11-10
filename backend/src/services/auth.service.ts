import { HttpError } from "../errors/http-error.js";
import { signJwt } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { UserRepository } from "../repositories/user.repository.js";
import type { CreateUserInput, LoginInput } from "../schemas/user.schema.js";

const userRepository = new UserRepository();

export class AuthService {
    async register(data: CreateUserInput) {
        const existingUser = await userRepository.findByEmail(data.email);

        if (existingUser) {
            throw new HttpError(409, "Email já cadastrado");
        }

        const user = await userRepository.create({
            ...data,
            passwordHash: await hashPassword(data.password),
        });

        return {
            user,
            token: signJwt({
                sub: user.id,
                email: user.email,
                name: user.nome,
            }),
        };
    }

    async login(data: LoginInput) {
        const user = await userRepository.findByEmailWithPassword(data.email);

        if (!user || !(await verifyPassword(data.password, user.senhaHash))) {
            throw new HttpError(401, "Email ou senha inválidos");
        }

        const { senhaHash, ...publicUser } = user;

        return {
            user: publicUser,
            token: signJwt({
                sub: publicUser.id,
                email: publicUser.email,
                name: publicUser.nome,
            }),
        };
    }
}
