import type { ReactNode } from "react";

type Props = { children: ReactNode; variante?: "jaune" | "blanc" };

export function PastilleArticleActus({ children, variante = "jaune" }: Props) {
  return (
    <span className={`inline-block rounded-[14px] border-2 border-encre px-2.5 py-1 text-xs leading-snug font-extrabold text-encre ${variante === "jaune" ? "bg-jaune-clair" : "bg-white"}`}>
      {children}
    </span>
  );
}
