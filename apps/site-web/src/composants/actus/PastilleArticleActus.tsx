import type { ReactNode } from "react";

type Props = { children: ReactNode; variante?: "jaune" | "blanc" };

export function PastilleArticleActus({ children, variante = "jaune" }: Props) {
  return (
    <span className={`inline-block rounded-full border-2 border-encre px-2.5 py-1 text-xs font-extrabold text-encre ${variante === "jaune" ? "bg-jaune-clair" : "bg-white"}`}>
      {children}
    </span>
  );
}
