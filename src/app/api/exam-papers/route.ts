import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { examRepository } from "@/features/exams/repositories/exam.repository";
import { serializeBigInt } from "@/lib/json";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const formData = await req.formData();
  const data = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    year: Number(formData.get("year")),
    price: Number(formData.get("price")),
    priceWithCorrection: formData.get("priceWithCorrection")
      ? Number(formData.get("priceWithCorrection"))
      : undefined,
    competitionId: formData.get("competitionId") as string,
    subjectId: formData.get("subjectId") as string,
    paperFileId: formData.get("paperFileId") as string,
    correctionFileId: (formData.get("correctionFileId") as string) || undefined,
    professorName: (formData.get("professorName") as string) || undefined,
    professorPhone: (formData.get("professorPhone") as string) || undefined,
    authorId: session.user.id,
    publishedAt: new Date(),
  };

  const exam = await examRepository.create(data);
  return NextResponse.json(serializeBigInt(exam));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const result = await examRepository.findAll({
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    competitionId: searchParams.get("competitionId") ?? undefined,
    subjectId: searchParams.get("subjectId") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    status: "PUBLISHED",
    sortBy: searchParams.get("sortBy") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
  });

  return NextResponse.json(serializeBigInt(result));
}
