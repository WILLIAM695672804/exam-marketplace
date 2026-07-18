import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { categoryRepository } from "@/features/categories/repositories/category.repository";

export async function GET() {
  const categories = await categoryRepository.findAll();
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

  const { name, slug, description } = await req.json();
  const cat = await categoryRepository.create({ name, slug, description });
  return NextResponse.json(cat);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

  const { id, name, slug, description } = await req.json();
  const cat = await categoryRepository.update(id, { name, slug, description });
  return NextResponse.json(cat);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN")) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

  const { id } = await req.json();
  await categoryRepository.softDelete(id);
  return NextResponse.json({ success: true });
}
