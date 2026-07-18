"use server";

import { requireRole } from "@/server/permissions/guard";
import { categoryRepository } from "../repositories/category.repository";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  await requireRole("ADMIN");
  const data = categorySchema.parse(Object.fromEntries(formData));
  return categoryRepository.create(data);
}

export async function updateCategory(id: string, formData: FormData) {
  await requireRole("ADMIN");
  const data = categorySchema.partial().parse(Object.fromEntries(formData));
  return categoryRepository.update(id, data);
}

export async function deleteCategory(id: string) {
  await requireRole("ADMIN");
  return categoryRepository.softDelete(id);
}
