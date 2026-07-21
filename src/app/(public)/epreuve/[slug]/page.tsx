"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface ExamDetail {
  id: string;
  title: string;
  slug: string;
  year: number;
  price: number;
  priceWithCorrection: number | null;
  status: string;
  professorName: string | null;
  professorPhone: string | null;
  competition: { name: string; category: { name: string; slug: string } };
  subject: { name: string; slug: string };
  author: { firstName: string; lastName: string };
  paperFile: { id: string };
  correctionFile: { id: string } | null;
}

export default function EpreuveDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"exam" | "correction">("exam");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/exam-papers/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setExam(data);
        }
      } catch {
        // API inaccessible
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          const roles: string[] = session?.user?.roles ?? [];
          setIsAdmin(roles.includes("ADMIN"));
        }
      } catch {
        // Non connecte
      }
    }
    checkSession();
  }, []);

  const price =
    selectedOption === "correction" && exam?.priceWithCorrection
      ? formatPrice(exam.priceWithCorrection)
      : exam
        ? formatPrice(exam.price)
        : "...";

  async function handleAddToCart() {
    if (!exam) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examPaperId: exam.id,
        withCorrection: selectedOption === "correction",
      }),
    });
    if (res.status === 401) {
      window.location.href = `/connexion?callbackUrl=/epreuve/${slug}`;
      return;
    }
    if (!res.ok) return;
  }

  async function handleBuyNow() {
    if (!exam) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examPaperId: exam.id,
        withCorrection: selectedOption === "correction",
      }),
    });
    if (res.status === 401) {
      window.location.href = `/connexion?callbackUrl=/epreuve/${slug}`;
      return;
    }
    window.location.href = "/dashboard/panier";
  }

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-7 aspect-[4/3] bg-surface-variant" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-10 bg-surface-variant w-3/4" />
            <div className="h-6 bg-surface-variant w-1/4" />
            <div className="h-40 bg-surface-variant w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap text-center">
        <h1 className="font-headline-lg text-primary mb-4">Epreuve introuvable</h1>
        <Link
          href="/catalogue"
          className="font-label-caps text-label-caps text-primary hover:text-secondary underline"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] bg-surface-variant border border-outline-variant overflow-hidden flex items-center justify-center">
            <span className="font-headline-lg text-[80px] text-on-surface-variant/20 select-none">
              {exam.title.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <span className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-highest text-on-surface border border-outline-variant">
              {exam.year}
            </span>
            <Link
              href={`/catalogue?category=${exam.competition.category.slug}`}
              className="font-label-caps text-label-caps text-secondary hover:underline"
            >
              {exam.competition.category.name}
            </Link>
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {exam.subject.name}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <h1 className="font-headline-lg text-primary mb-4">{exam.title}</h1>
          <p className="font-body-md text-on-surface-variant mb-4">
            Par {exam.author.firstName} {exam.author.lastName}
          </p>

          {/* Infos professeur (admin uniquement) */}
          {isAdmin && (exam.professorName || exam.professorPhone) && (
            <div className="border border-secondary-fixed-dim/50 bg-secondary-fixed/10 p-4 mb-6 space-y-1">
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">
                Professeur remettant
              </p>
              {exam.professorName && (
                <p className="font-body-sm text-primary">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                    Nom :
                  </span>{" "}
                  {exam.professorName}
                </p>
              )}
              {exam.professorPhone && (
                <p className="font-body-sm text-primary">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                    Tel :
                  </span>{" "}
                  {exam.professorPhone}
                </p>
              )}
            </div>
          )}

          <div className="border border-outline-variant bg-surface-container-lowest p-8 space-y-6">
            <label className="flex items-center justify-between cursor-pointer border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pricing"
                  checked={selectedOption === "exam"}
                  onChange={() => setSelectedOption("exam")}
                  className="border-outline-variant text-primary focus:ring-primary w-4 h-4"
                />
                <div>
                  <span className="font-body-lg text-primary font-medium">Epreuve seule</span>
                  <p className="font-body-sm text-on-surface-variant">
                    Acces au fichier de l&apos;epreuve
                  </p>
                </div>
              </div>
              <span className="font-body-lg text-primary font-bold">{formatPrice(exam.price)}</span>
            </label>

            {exam.priceWithCorrection && (
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="pricing"
                    checked={selectedOption === "correction"}
                    onChange={() => setSelectedOption("correction")}
                    className="border-outline-variant text-primary focus:ring-primary w-4 h-4"
                  />
                  <div>
                    <span className="font-body-lg text-primary font-medium">Avec corrige</span>
                    <p className="font-body-sm text-on-surface-variant">
                      Epreuve + guide de correction officiel
                    </p>
                  </div>
                </div>
                <span className="font-body-lg text-primary font-bold">
                  {formatPrice(exam.priceWithCorrection)}
                </span>
              </label>
            )}

            <div className="pt-6 border-t border-outline-variant space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body-lg text-primary">Total</span>
                <span className="font-headline-sm text-primary">{price}</span>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 hover:bg-inverse-surface transition-colors flex items-center justify-center gap-2 group"
              >
                Acheter maintenant
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button
                onClick={handleAddToCart}
                className="w-full border border-primary text-primary font-label-caps text-label-caps py-4 hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                Ajouter au panier
              </button>

              <p className="text-center font-body-sm text-on-surface-variant flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Paiement securise via Fapshi
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-section-gap pt-8 border-t border-outline-variant">
        <Link
          href="/catalogue"
          className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>Retour au
          catalogue
        </Link>
      </div>
    </div>
  );
}
