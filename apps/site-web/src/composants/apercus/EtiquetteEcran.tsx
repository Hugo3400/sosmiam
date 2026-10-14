import type { ReactNode } from "react";

type Variante = "claire" | "sombre" | "jaune" | "proposee";

const styles: Record<Variante, string> = {
  claire: "border border-ligne bg-white",
  sombre: "bg-encre text-creme",
  jaune: "bg-jaune",
  proposee: "border border-dashed border-gris bg-transparent",
};

/** Petite étiquette arrondie dans un écran dessiné (filtre, étiquette d'une sortie ou d'un lieu, public réservé). */
export function EtiquetteEcran({ children, variante = "claire" }: { children: ReactNode; variante?: Variante }) {
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${styles[variante]}`}>{children}</span>;
}
