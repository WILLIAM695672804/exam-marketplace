"use client";

import { useState, useEffect } from "react";

interface CartItem {
  id: string;
  withCorrection: boolean;
  examPaper: {
    id: string;
    title: string;
    slug: string;
    price: number;
    priceWithCorrection: number | null;
    competition: { name: string };
    author: { firstName: string; lastName: string };
  };
}

export function PanierContent() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items);
        }
      } catch { /* API inaccessible */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleRemove(examPaperId: string) {
    setItems((prev) => prev.filter((i) => i.examPaper.id !== examPaperId));
    await fetch("/api/cart", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examPaperId }) });
  }

  async function handleToggleCorrection(examPaperId: string, current: boolean) {
    setItems((prev) => prev.map((i) => i.examPaper.id === examPaperId ? { ...i, withCorrection: !current } : i));
    await fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examPaperId, withCorrection: !current }) });
  }

  const total = items.reduce((sum, item) => {
    const price = item.withCorrection && item.examPaper.priceWithCorrection
      ? Number(item.examPaper.priceWithCorrection)
      : Number(item.examPaper.price);
    return sum + price;
  }, 0);

  if (loading) {
    return <div className="max-w-container-max mx-auto w-full animate-pulse space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 bg-surface-variant" />)}</div>;
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      <div className="mb-12">
        <h2 className="font-headline-md text-primary mb-2">Mon Panier</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Gerer les epreuves dans votre panier avant de passer commande.</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-section-gap text-center border border-outline-variant bg-surface-container-lowest">
          <span className="material-symbols-outlined text-outline text-[48px] mb-4">shopping_cart</span>
          <h2 className="font-headline-md text-headline-md mb-2">Panier vide</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">Ajoutez des epreuves depuis le catalogue.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-gutter">
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest border border-outline-variant p-6 flex flex-col md:flex-row justify-between gap-4 hover:border-primary transition-colors">
                <div className="flex flex-col gap-2">
                  <h3 className="font-headline-sm text-primary">{item.examPaper.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="font-body-lg text-primary">
                      ${(item.withCorrection && item.examPaper.priceWithCorrection
                        ? Number(item.examPaper.priceWithCorrection)
                        : Number(item.examPaper.price)
                      ).toFixed(2)}
                    </span>
                    {item.examPaper.priceWithCorrection && (
                      <span className="font-label-caps text-label-caps text-secondary">
                        + Corrige (${Number(item.examPaper.priceWithCorrection).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.examPaper.priceWithCorrection && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={item.withCorrection} onChange={() => handleToggleCorrection(item.examPaper.id, item.withCorrection)} className="border-outline-variant text-primary focus:ring-primary w-4 h-4 rounded-none" />
                      <span className="font-body-sm text-on-surface-variant">Avec corrige</span>
                    </label>
                  )}
                  <button onClick={() => handleRemove(item.examPaper.id)} className="p-2 hover:bg-error-container transition-colors">
                    <span className="material-symbols-outlined text-[20px] text-error">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-80 bg-surface-container-lowest border border-outline-variant p-8 h-fit sticky top-28">
            <h3 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-4">Recapitulatif</h3>
            <div className="flex justify-between mb-4">
              <span className="font-body-md text-on-surface-variant">Sous-total</span>
              <span className="font-body-md text-primary">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="font-body-md text-on-surface-variant">Commission</span>
              <span className="font-body-md text-primary">Incluse</span>
            </div>
            <div className="flex justify-between font-bold mb-8 pt-4 border-t border-outline-variant">
              <span className="font-headline-sm text-primary">Total</span>
              <span className="font-headline-sm text-primary">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={async () => {
                const res = await fetch("/api/orders/create", { method: "POST" });
                if (res.ok) {
                  const order = await res.json();
                  await fetch("/api/payments/simulate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.id }),
                  });
                  window.location.href = "/dashboard/commandes";
                }
              }}
              className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-4 hover:bg-inverse-surface transition-colors"
            >
              Proceder au paiement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
