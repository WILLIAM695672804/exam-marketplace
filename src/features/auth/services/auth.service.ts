import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { userRepository } from "../repositories/user.repository";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

const SALT_ROUNDS = 12;

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  generateTokenHash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  },

  async authenticate(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !user.passwordHash) {
      return { success: false as const, error: "Email ou mot de passe incorrect." };
    }

    const isValid = await this.verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      return { success: false as const, error: "Email ou mot de passe incorrect." };
    }

    if (!user.isActive) {
      return {
        success: false as const,
        error: "Votre compte a ete desactive. Contactez le support.",
      };
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    return {
      success: true as const,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles,
      },
    };
  },

  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      return { success: false as const, error: "Un compte avec cet email existe deja." };
    }

    const passwordHash = await this.hashPassword(input.password);

    const user = await userRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
    });

    return {
      success: true as const,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    };
  },

  async initiatePasswordReset(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { success: true as const };
    }

    const token = this.generateToken();
    const tokenHash = this.generateTokenHash(token);
    const expires = new Date(Date.now() + 3600 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: tokenHash,
        expires,
      },
    });

    return { success: true as const, token, email };
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.generateTokenHash(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return { success: false as const, error: "Lien invalide ou expire." };
    }

    const user = await userRepository.findByEmail(verificationToken.identifier);
    if (!user) {
      return { success: false as const, error: "Utilisateur introuvable." };
    }

    const passwordHash = await this.hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);

    await prisma.verificationToken.delete({
      where: { token: tokenHash },
    });

    return { success: true as const };
  },
};
