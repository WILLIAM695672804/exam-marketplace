import { NextResponse } from "next/server";
import { examRepository } from "@/features/exams/repositories/exam.repository";
import { serializeBigInt } from "@/lib/json";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = await examRepository.findBySlug(slug);
  if (!exam) {
    return NextResponse.json({ error: "Epreuve introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializeBigInt(exam));
}
