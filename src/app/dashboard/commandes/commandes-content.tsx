"use client";

import { useState, useEffect } from "react";
import { AlertModal } from "@/components/ui/alert-modal";

interface OrderItem {
  id: string;
  price: number;
  withCorrection: boolean;
  titleSnapshot: string;
  yearSnapshot: number;
  authorSnapshot: string;
  examPaper: { title: string; slug: string };
  downloads: { id: string }[];
  review: { rating: number } | null;
}

interface Order {
  id: string;
  number: string;
  totalAmount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
  transactions: { id: string; status: string }[];
}

export function CommandesContent() {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("completed");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch {
        // API inaccessible
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDownload(orderItemId: string, type: string) {
    const res = await fetch(`/api/download?orderItemId=${orderItemId}&type=${type}`);
    if (!res.ok) {
      const data = await res.json();
      setAlertMsg(data.error || "Erreur lors du telechargement");
      return;
    }
    // Telecharger le fichier
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epreuve-${type}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const completedOrders = orders.filter((o) => o.status === "PAID");

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-stack-lg">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="font-display-lg text-primary tracking-tight">Mes Commandes</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Gerer votre historique de transactions, telecharger vos epreuves et suivre vos factures.
        </p>
      </div>

      <div className="flex border-b border-outline-variant w-full">
        <button onClick={() => setActiveTab("pending")} className={`py-4 px-6 font-label-caps text-label-caps uppercase transition-colors border-b-2 ${activeTab === "pending" ? "text-primary border-primary font-bold" : "text-on-surface-variant border-transparent hover:text-primary"}`}>
          En attente ({pendingOrders.length})
        </button>
        <button onClick={() => setActiveTab("completed")} className={`py-4 px-6 font-label-caps text-label-caps uppercase transition-colors border-b-2 ${activeTab === "completed" ? "text-primary border-primary font-bold" : "text-on-surface-variant border-transparent hover:text-primary"}`}>
          Terminees ({completedOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-surface-variant" />)}
        </div>
      ) : activeTab === "pending" ? (
        <div className="flex flex-col gap-6">
          {pendingOrders.length === 0 ? (
            <p className="text-center text-on-surface-variant py-20">Aucune commande en attente.</p>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.id} className="py-6 flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-body-lg text-body-lg text-primary">{order.number}</span>
                    <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] uppercase">En attente</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{new Date(order.createdAt).toLocaleDateString("fr")}</span>
                </div>
                <div className="flex flex-col md:items-end gap-3">
                  <span className="font-headline-sm text-headline-sm text-primary">${Number(order.totalAmount).toFixed(2)}</span>
                  <button className="py-2 px-6 bg-primary text-on-primary font-label-caps text-label-caps uppercase hover:bg-inverse-surface transition-colors">Payer maintenant</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {completedOrders.length === 0 ? (
            <p className="text-center text-on-surface-variant py-20">Aucune commande terminee.</p>
          ) : (
            completedOrders.map((order) => (
              <div key={order.id} className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary pb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-headline-sm text-headline-sm text-primary">{order.number}</h3>
                    <span className="px-2 py-1 bg-surface-container-high text-on-surface font-label-caps text-[10px] uppercase border border-outline-variant">Payee</span>
                  </div>
                  <div className="text-right mt-2 md:mt-0">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Achete le {new Date(order.createdAt).toLocaleDateString("fr")}</p>
                    <p className="font-body-md text-body-md text-primary font-medium">Total: ${Number(order.totalAmount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="bg-surface-bright border border-outline-variant p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-primary transition-colors duration-300">
                      <div className="flex flex-col gap-3 max-w-xl">
                        <h4 className="font-headline-sm text-primary leading-tight">{item.titleSnapshot}</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.withCorrection && <span className="px-2 py-1 bg-surface-container text-on-surface-variant font-label-caps text-[10px] uppercase">Avec corrige</span>}
                          <span className="px-2 py-1 bg-surface-container text-on-surface-variant font-label-caps text-[10px] uppercase">{item.yearSnapshot}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">${Number(item.price).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col md:items-end justify-center gap-3 shrink-0">
                        <div className="flex gap-3">
                          <button onClick={() => handleDownload(item.id, "paper")} className="py-2 px-4 border border-primary text-primary font-label-caps text-label-caps uppercase hover:bg-surface-container-high transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">download</span>Epreuve
                          </button>
                          {item.withCorrection && (
                            <button onClick={() => handleDownload(item.id, "correction")} className="py-2 px-4 border border-primary text-primary font-label-caps text-label-caps uppercase hover:bg-surface-container-high transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">download</span>Corrige
                            </button>
                          )}
                        </div>
                        {item.review ? (
                          <div className="flex items-center gap-1 mt-2 text-secondary">
                            {Array.from({ length: item.review.rating }, (_, i) => (
                              <span key={i} className="material-symbols-outlined text-[14px]">star</span>
                            ))}
                            <span className="font-label-caps text-[10px] uppercase ml-2 text-on-surface-variant">Evalue</span>
                          </div>
                        ) : (
                          <button className="text-on-surface-variant font-label-caps text-label-caps uppercase hover:text-primary transition-colors underline decoration-1 underline-offset-4 mt-2">Laisser un avis</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AlertModal
        open={alertMsg !== null}
        message={alertMsg || ""}
        onClose={() => setAlertMsg(null)}
      />
    </div>
  );
}
