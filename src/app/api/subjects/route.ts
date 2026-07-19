import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { subjectRepository } from "@/features/subjects/repositories/subject.repository";

function requireAdmin(session: unknown) {
  if (!session) return false;
  const roles = (session as { user?: { roles?: string[] } }).user?.roles ?? [];
  return roles.includes("ADMIN");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get("competitionId") ?? undefined;
  const subjects = await subjectRepository.findAll(competitionId);
  return NextResponse.json(subjects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { name, slug, competitionId } = await req.json();
  const subj = await subjectRepository.create({ name, slug, competitionId });
  return NextResponse.json(subj);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { id, name, slug } = await req.json();
  const subj = await subjectRepository.update(id, { name, slug });
  return NextResponse.json(subj);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!requireAdmin(session)) return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  const { id } = await req.json();
  await subjectRepository.softDelete(id);
  return NextResponse.json({ success: true });
}
