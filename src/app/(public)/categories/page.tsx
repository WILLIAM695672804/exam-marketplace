import Link from "next/link";
import { categoryRepository } from "@/features/categories/repositories/category.repository";

export default async function CategoriesPage() {
  const categories = await categoryRepository.findAll();

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="mb-16 border-b border-outline-variant pb-stack-lg">
        <h1 className="font-headline-lg text-primary mb-4">Categories</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Parcourez les epreuves par categorie de concours.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-on-surface-variant py-20">
          Aucune categorie pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogue?category=${cat.slug}`}
              className="group border border-outline-variant bg-surface-container-lowest p-8 hover:border-primary transition-colors duration-300 flex flex-col justify-between h-56"
            >
              <div>
                <h3 className="font-headline-sm text-primary mb-3 group-hover:text-secondary transition-colors">
                  {cat.name}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {cat.description || ""}
                </p>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant mt-4">
                {cat._count.competitions} concours
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
