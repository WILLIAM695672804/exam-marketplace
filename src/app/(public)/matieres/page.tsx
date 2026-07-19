import Link from "next/link";
import { subjectRepository } from "@/features/subjects/repositories/subject.repository";

export default async function MatieresPage() {
  const subjects = await subjectRepository.findAll();

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="mb-16 border-b border-outline-variant pb-stack-lg">
        <h1 className="font-headline-lg text-primary mb-4">Matieres</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Toutes les matieres disponibles sur la plateforme.
        </p>
      </div>

      {subjects.length === 0 ? (
        <p className="text-center text-on-surface-variant py-20">Aucune matiere pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/catalogue?subject=${encodeURIComponent(subject.name)}`}
              className="border border-outline-variant bg-surface-container-lowest p-6 hover:border-primary transition-colors duration-300"
            >
              <span className="font-body-md text-body-md text-primary hover:text-secondary transition-colors">
                {subject.name}
              </span>
              <p className="font-body-sm text-on-surface-variant mt-1">
                {subject._count.examPapers} epreuves
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
