"use server";

import { requireRole } from "@/server/permissions/guard";
import { subjectRepository } from "../repositories/subject.repository";
import { z } from "zod";

const subjectSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  competitionId: z.string().uuid(),
});

export async function createSubject(formData: FormData) {
  await requireRole("ADMIN");
  const data = subjectSchema.parse(Object.fromEntries(formData));
  return subjectRepository.create(data);
}

export async function updateSubject(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const data = subjectSchema.partial().parse(Object.fromEntries(formData));
  return subjectRepository.update(id, data);
}

export async function deleteSubject(id: string) {
  await requireRole("ADMIN");
  return subjectRepository.softDelete(id);
}
