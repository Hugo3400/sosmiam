import type { ReactNode } from "react";

type Ton = "neutre" | "jaune" | "vert" | "rouge" | "encre";

const TONS: Record<Ton, string> = {
  neutre: "bg-ligne/70 text-gris",
  jaune: "bg-jaune-clair text-encre",
  vert: "bg-vert-clair text-vert",
  rouge: "bg-rose-alerte text-rouge-texte",
  encre: "bg-nuit text-jaune",
};

/** Petite étiquette d'état : « Publié », « Brouillon », « Urgent »… */
export function Badge({ children, ton = "neutre" }: { children: ReactNode; ton?: Ton }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${TONS[ton]}`}>{children}</span>;
}
