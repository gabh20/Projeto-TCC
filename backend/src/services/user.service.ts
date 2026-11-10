import {UserRepository} from "../repositories/user.repository.js";
import type {UpdateUserInput} from "../schemas/user.schema.js";
import {HttpError} from "../errors/http-error.js";

const userRepository = new UserRepository();

export class UserService {
    async findAll() {
        return userRepository.findAll();
    }

    async findById(id: number) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new HttpError(404, "Usuário não encontrado");
        }

        return user;
    }

    async update(id: number, data: UpdateUserInput) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new HttpError(404, "Usuário não encontrado");
        }

        if (data.email && data.email !== user.email) {
            const emailAlreadyInUse = await userRepository.findByEmail(data.email);

            if (emailAlreadyInUse) {
                throw new HttpError(409, "Email já cadastrado");
            }
        }

        return userRepository.update(id, data);
    }

    async delete(id: number) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new HttpError(404, "Usuário não encontrado");
        }

        return userRepository.delete(id);
    }
}
