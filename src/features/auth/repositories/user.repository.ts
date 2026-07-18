import { prisma } from "@/lib/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
        teacherRequest: true,
      },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        teacherRequest: true,
      },
    });
  },

  create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }) {
    return prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        userRoles: {
          create: {
            role: { connect: { name: "BUYER" } },
          },
        },
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },

  verifyEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
  },

  updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  findByEmailWithRoles(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });
  },
};
