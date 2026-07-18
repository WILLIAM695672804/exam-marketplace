export default function AProposPage() {
  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7">
          <h1 className="font-headline-lg text-primary mb-8">A propos</h1>

          <div className="space-y-8">
            <div>
              <h2 className="font-headline-sm text-primary mb-4">Notre mission</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Exam Marketplace democratise l&apos;acces aux epreuves de concours en
                Afrique. Nous permettons aux candidats de se preparer efficacement
                en accedant a une vaste bibliotheque d&apos;epreuves authentiques avec
                leurs corriges, tout en offrant aux enseignants une plateforme pour
                valoriser leur expertise.
              </p>
            </div>

            <div>
              <h2 className="font-headline-sm text-primary mb-4">Pourquoi nous choisir</h2>
              <ul className="space-y-4">
                {[
                  {
                    title: "Epreuves verifiees",
                    desc: "Toutes nos epreuves sont examinees et validees par des enseignants qualifies.",
                  },
                  {
                    title: "Paiement securise",
                    desc: "Payez en toute confiance via Mobile Money, Orange Money et les cartes bancaires.",
                  },
                  {
                    title: "Telechargement instantane",
                    desc: "Accedez a vos epreuves immediatement apres confirmation du paiement.",
                  },
                  {
                    title: "Support local",
                    desc: "Une equipe basee en Afrique, qui comprend vos besoins et parle vos langues.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="material-symbols-outlined text-secondary mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <div>
                      <h3 className="font-body-lg text-primary font-medium">{item.title}</h3>
                      <p className="font-body-sm text-on-surface-variant mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-headline-sm text-primary mb-4">Contact</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Pour toute question, contactez-nous a{" "}
                <a
                  href="mailto:support@exammarketplace.com"
                  className="text-primary underline decoration-secondary/50 hover:text-secondary transition-colors"
                >
                  support@exammarketplace.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
