import { User, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../client";
import { LoginCredentials } from "../interfaces/LoginDTO";
import { UserDTO } from "../interfaces/UserDTO";
import logger from "../logger";

const UserService = {
    async hasAdmin(): Promise<boolean> {
        const hasAdmins = await prisma.user.findFirst({
            where: { administrator: true },
        });

        return hasAdmins != undefined;
    },

    async findMany(): Promise<Partial<User>[]> {
        return prisma.user.findMany({
            select: {
                id: true,
                administrator: true,
                email: true,
                nickname: true,
                nome: true,
                password: false,
                createdAt: false,
            },
        });
    },

    async findById(id: number): Promise<UserDTO | null> {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                administrator: true,
                email: true,
                nickname: true,
                nome: true,
                password: false,
                createdAt: false,
            },
        });
    },

    async create(user: Prisma.UserCreateInput): Promise<number> {
        const encryptedPassword = await bcrypt.hash(user.password, 8);

        logger.info(user);

        user.password = encryptedPassword;

        const createdUser = await prisma.user.create({
            data: user,
        });

        return createdUser.id;
    },

    async edit(userId: number, user: Partial<User>): Promise<number> {
        if (user.password) {
            const encryptedPassword = await bcrypt.hash(user.password, 8);
            user.password = encryptedPassword;
        } else {
            delete user.password;
        }

        logger.info(user);

        const createdUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: user,
        });

        return createdUser.id;
    },

    async login(
        login: LoginCredentials,
    ): Promise<Omit<User, "email" | "password"> | undefined> {
        const user = await prisma.user.findUnique({
            where: {
                email: login.email,
            },
            select: {
                id: true,
                email: true,
                nome: true,
                nickname: true,
                password: true,
                administrator: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new Error("Não encontrado");
        }

        if (await bcrypt.compare(login.password, user.password)) {
            return {
                id: user.id,
                nickname: user.nickname,
                nome: user.nome,
                administrator: user.administrator,
                createdAt: user.createdAt,
            };
        }

        return undefined;
    },

    async delete(userId: number) {
        await prisma.user.delete({
            where: { id: userId },
        });
    },

    async hasAnotherAdminThan(userId: number): Promise<boolean> {
        const user = await prisma.user.count({
            where: {
                id: {
                    not: userId,
                },
                administrator: true,
            },
        });

        return user > 0;
    },
};

export default UserService;
