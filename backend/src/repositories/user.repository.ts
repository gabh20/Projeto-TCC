import {prisma} from "../lib/prisma.js";
import type {CreateUserInput, UpdateUserInput} from "../schemas/user.schema.js";

const publicUserSelect = {
    id: true,
    nome: true,
    email: true,
    telefone: true,
    data: true,
    criadoEm: true,
    atualizadoEm: true,
} as const;

export type CreateUserData = Omit<CreateUserInput, "password"> & {
    passwordHash: string;
};

export class UserRepository {
    async findAll() {
        return prisma.usuarios.findMany({
            select: publicUserSelect,
            orderBy: {
                id: "desc",
            },
        });
    }

    async findById(id: number) {
        return prisma.usuarios.findUnique({
            where: {
                id,
            },
            select: publicUserSelect,
        });
    }

    async findByEmail(email: string) {
        return prisma.usuarios.findUnique({
            where: {
                email,
            },
            select: publicUserSelect,
        });
    }

    async findByEmailWithPassword(email: string) {
        return prisma.usuarios.findUnique({
            where: {
                email,
            },
            select: {
                ...publicUserSelect,
                senhaHash: true,
            },
        });
    }

    async create(data: CreateUserData) {
        return prisma.usuarios.create({
            data: {
                nome: data.name,
                email: data.email,
                telefone: data.phone,
                data: new Date(data.birthDate),
                senhaHash: data.passwordHash,
            },
            select: publicUserSelect,
        });
    }

    async update(id: number, data: UpdateUserInput) {
        const updateData: {
            nome?: string;
            email?: string;
            telefone?: string;
            data?: Date;
        } = {};

        if (data.name !== undefined) {
            updateData.nome = data.name;
        }

        if (data.email !== undefined) {
            updateData.email = data.email;
        }

        if (data.phone !== undefined) {
            updateData.telefone = data.phone;
        }

        if (data.birthDate !== undefined) {
            updateData.data = new Date(data.birthDate);
        }

        return prisma.usuarios.update({
            where: {
                id,
            },
            data: updateData,
            select: publicUserSelect,
        });
    }

    async delete(id: number) {
        return prisma.usuarios.delete({
            where: {
                id,
            },
            select: publicUserSelect,
        });
    }
}
