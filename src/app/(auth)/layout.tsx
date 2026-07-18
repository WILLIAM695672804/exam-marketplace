import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-grow flex items-center justify-center pt-[120px] pb-section-gap px-margin-mobile relative overflow-hidden">
        {/* Abstract background */}
        <div
          className="absolute inset-0 z-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, var(--color-outline-variant) 0%, transparent 50%)",
          }}
        />
        <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant/30 p-10 md:p-14 relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
