const FAQS = [
  {
    q: "Comment acheter une epreuve ?",
    a: "Creez un compte, parcourez le catalogue, ajoutez une epreuve au panier, puis procedez au paiement via Mobile Money, Orange Money ou carte bancaire.",
  },
  {
    q: "Comment devenir enseignant ?",
    a: "Inscrivez-vous comme acheteur, puis faites une demande d'accreditation enseignant depuis votre tableau de bord. Notre equipe examinera votre dossier.",
  },
  {
    q: "Combien de fois puis-je telecharger une epreuve ?",
    a: "Vous pouvez telecharger chaque epreuve jusqu'a 5 fois. Cette limite garantit la securite des contenus tout en vous offrant une flexibilite suffisante.",
  },
  {
    q: "Quels moyens de paiement sont acceptes ?",
    a: "Nous acceptons Mobile Money (MTN, Orange), Orange Money, et les cartes bancaires via notre partenaire NotchPay.",
  },
  {
    q: "Puis-je obtenir un remboursement ?",
    a: "Les epreuves sont des produits numeriques. Une fois telechargees, elles ne sont pas remboursables. En cas de probleme technique, contactez notre support.",
  },
  {
    q: "Comment sont protegees mes donnees ?",
    a: "Vos donnees sont chiffrees et stockees de maniere securisee. Consultez notre politique de confidentialite pour plus de details.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-[800px] mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="mb-16 border-b border-outline-variant pb-stack-lg">
        <h1 className="font-headline-lg text-primary mb-4">Questions frequentes</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Trouvez rapidement des reponses a vos questions les plus frequentes.
        </p>
      </div>

      <div className="space-y-0 border border-outline-variant bg-surface-container-lowest divide-y divide-outline-variant/50">
        {FAQS.map((faq, idx) => (
          <details key={idx} className="group">
            <summary className="flex justify-between items-center px-8 py-6 cursor-pointer hover:bg-surface-container-low transition-colors list-none">
              <span className="font-body-lg text-primary font-medium pr-8">{faq.q}</span>
              <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform shrink-0">
                expand_more
              </span>
            </summary>
            <p className="px-8 pb-6 font-body-md text-on-surface-variant leading-relaxed">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
