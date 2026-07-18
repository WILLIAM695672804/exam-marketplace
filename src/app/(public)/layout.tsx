import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </>
  );
}
