import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { competitionRepository } from "@/features/competitions/repositories/competition.repository";

function requireAdmin(session: unknown) {
  if (!session) return false;
  const roles = ((session as { user?: { roles?: string[] } }).user?.roles) ?? [];
  return roles.includes("ADMIN");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const competitions = await competitionRepository.findAll(categoryId);
  return NextResponse.json(competitions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { name, slug, categoryId, organisme } = await req.json();
  const comp = await competitionRepository.create({ name, slug, categoryId, organisme });
  return NextResponse.json(comp);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { id, name, slug, organisme } = await req.json();
  const comp = await competitionRepository.update(id, { name, slug, organisme });
  return NextResponse.json(comp);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { id } = await req.json();
  await competitionRepository.softDelete(id);
  return NextResponse.json({ success: true });
}
