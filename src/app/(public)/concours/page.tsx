import Link from "next/link";
import { competitionRepository } from "@/features/competitions/repositories/competition.repository";

export default async function ConcoursPage() {
  const competitions = await competitionRepository.findAll();

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="mb-16 border-b border-outline-variant pb-stack-lg">
        <h1 className="font-headline-lg text-primary mb-4">Concours</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Liste des concours disponibles avec leurs epreuves associees.
        </p>
      </div>

      {competitions.length === 0 ? (
        <p className="text-center text-on-surface-variant py-20">Aucun concours pour le moment.</p>
      ) : (
        <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Concours</th>
                <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Categorie</th>
                <th className="text-right font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">Epreuves</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => (
                <tr key={comp.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/catalogue?concours=${comp.slug}`} className="font-body-md text-primary hover:text-secondary transition-colors">{comp.name}</Link>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">{comp.category.name}</td>
                  <td className="px-6 py-4 text-right font-body-sm text-on-surface-variant">{comp._count.examPapers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
