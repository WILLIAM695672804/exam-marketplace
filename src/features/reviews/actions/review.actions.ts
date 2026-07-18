"use server";

import { auth } from "@/lib/auth";
import { reviewRepository } from "../repositories/review.repository";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  orderItemId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function submitReview(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");

  const data = reviewSchema.parse({
    orderItemId: formData.get("orderItemId"),
    rating: Number(formData.get("rating")),
    comment: formData.get("comment") || undefined,
  });

  // Verifier que l'orderItem appartient bien a l'utilisateur
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: data.orderItemId },
    include: { order: true },
  });

  if (!orderItem || orderItem.order.userId !== session.user.id) {
    throw new Error("Non autorise");
  }

  return reviewRepository.create(data.orderItemId, data.rating, data.comment);
}
