import type { ReactNode } from "react";

type Variante = "jaune" | "alerte" | "blanc";

const couleurs: Record<Variante, string> = {
  jaune: "bg-jaune-clair text-encre",
  alerte: "bg-rose-alerte text-rouge-texte",
  blanc: "bg-white text-encre border-2 border-encre",
};

/** Petite pastille arrondie au-dessus d'un titre ou sur une carte. */
export function Badge({ children, variante = "jaune", className = "" }: { children: ReactNode; variante?: Variante; className?: string }) {
  return (
    <p className={`inline-block rounded-full px-3.5 py-1.5 text-[.9rem] font-semibold ${couleurs[variante]} ${className}`}>
      {children}
    </p>
  );
}
