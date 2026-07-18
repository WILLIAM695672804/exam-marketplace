"use server";

import { auth } from "@/lib/auth";
import { requireRole } from "@/server/permissions/guard";
import { prisma } from "@/lib/prisma";
import { mailService } from "@/server/emails/mail.service";

export async function requestTeacherRole(_formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");

  const existing = await prisma.teacherRequest.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    throw new Error("Vous avez deja une demande en cours");
  }

  return prisma.teacherRequest.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
    },
  });
}

export async function approveTeacherRequest(requestId: string) {
  await requireRole("ADMIN");

  const request = await prisma.teacherRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", reviewedAt: new Date() },
    include: { user: true },
  });

  // Ajouter le role TEACHER
  const teacherRole = await prisma.role.findUnique({ where: { name: "TEACHER" } });
  if (teacherRole) {
    await prisma.userRoleOnRole.upsert({
      where: { userId_roleId: { userId: request.userId, roleId: teacherRole.id } },
      update: {},
      create: { userId: request.userId, roleId: teacherRole.id },
    });
  }

  // Envoyer email de validation
  await mailService.sendTeacherValidation(request.userId, true);

  return request;
}

export async function rejectTeacherRequest(requestId: string, reason: string) {
  await requireRole("ADMIN");

  const request = await prisma.teacherRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", rejectionReason: reason, reviewedAt: new Date() },
    include: { user: true },
  });

  await mailService.sendTeacherValidation(request.userId, false, reason);

  return request;
}
