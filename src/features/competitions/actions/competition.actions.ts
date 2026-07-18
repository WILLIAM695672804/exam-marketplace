"use server";

import { requireRole } from "@/server/permissions/guard";
import { competitionRepository } from "../repositories/competition.repository";
import { z } from "zod";

const competitionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  categoryId: z.string().uuid(),
  organisme: z.string().optional(),
});

export async function createCompetition(formData: FormData) {
  await requireRole("ADMIN");
  const data = competitionSchema.parse(Object.fromEntries(formData));
  return competitionRepository.create(data);
}

export async function updateCompetition(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const data = competitionSchema.partial().parse(Object.fromEntries(formData));
  return competitionRepository.update(id, data);
}

export async function deleteCompetition(id: string) {
  await requireRole("ADMIN");
  return competitionRepository.softDelete(id);
}
