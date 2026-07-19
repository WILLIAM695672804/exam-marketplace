"use server";

import { auth } from "@/lib/auth";
import { requireRole } from "@/server/permissions/guard";
import { examRepository } from "../repositories/exam.repository";
import { z } from "zod";

const examSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  year: z.coerce.number().int().min(1900).max(2100),
  price: z.coerce.number().positive(),
  priceWithCorrection: z.coerce.number().positive().optional(),
  competitionId: z.string().uuid(),
  subjectId: z.string().uuid(),
  paperFileId: z.string().uuid(),
  correctionFileId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function publishExam(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");

  const data = examSchema.parse({
    ...Object.fromEntries(formData),
    publishedAt: new Date(),
  });

  return examRepository.create({
    ...data,
    authorId: session.user.id,
    publishedAt: new Date(),
  });
}

export async function updateExam(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");

  const exam = await examRepository.findById(id);
  if (!exam || exam.authorId !== session.user.id) {
    await requireRole("ADMIN");
  }

  const data = examSchema.partial().parse(Object.fromEntries(formData));
  return examRepository.update(
    id,
    data as Record<string, unknown> as Parameters<typeof examRepository.update>[1]
  );
}

export async function deleteExam(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");

  const exam = await examRepository.findById(id);
  if (!exam || exam.authorId !== session.user.id) {
    await requireRole("ADMIN");
  }

  return examRepository.softDelete(id);
}

export async function maskExam(id: string) {
  await requireRole("ADMIN");
  return examRepository.mask(id);
}

export async function unmaskExam(id: string) {
  await requireRole("ADMIN");
  return examRepository.unmask(id);
}
