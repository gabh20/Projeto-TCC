import { z } from "zod";

const passwordSchema = z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[a-z]/, "Senha deve conter uma letra minúscula")
    .regex(/[A-Z]/, "Senha deve conter uma letra maiúscula")
    .regex(/\d/, "Senha deve conter um número");

const birthDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida")
    .refine((value) => {
        const [year, month, day] = value.split("-").map(Number);

        if (!year || !month || !day) {
            return false;
        }

        const date = new Date(Date.UTC(year, month - 1, day));
        const today = new Date();
        const minDate = new Date(Date.UTC(1900, 0, 1));
        const maxDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day &&
            date >= minDate &&
            date <= maxDate
        );
    }, "Data de nascimento deve ser uma data real entre 1900 e hoje");

export const createUserSchema = z.object({
    name: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.email("Email inválido").transform((email) => email.toLowerCase()),
    phone: z
        .string()
        .transform((phone) => phone.replace(/\D/g, ""))
        .refine((phone) => phone.length === 10 || phone.length === 11, "Telefone deve ter DDD e 10 ou 11 dígitos"),
    birthDate: birthDateSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: z.email("Email inválido").transform((email) => email.toLowerCase()),
    password: z.string().min(1, "Senha é obrigatória"),
});

export const updateUserSchema = createUserSchema.omit({ password: true }).partial();

export const userIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
