"use server";

import { auth } from "@/lib/auth";
import { cartRepository } from "../repositories/cart.repository";

export async function addToCart(examPaperId: string, withCorrection = false) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");
  return cartRepository.add(session.user.id, examPaperId, withCorrection);
}

export async function updateCartItem(examPaperId: string, withCorrection: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");
  return cartRepository.update(session.user.id, examPaperId, withCorrection);
}

export async function removeFromCart(examPaperId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");
  return cartRepository.remove(session.user.id, examPaperId);
}

export async function clearCart() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifie");
  return cartRepository.clear(session.user.id);
}
