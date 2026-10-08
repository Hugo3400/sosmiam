import type { ReactNode } from "react";

/** Ce qu'on montre quand une liste est vide : un emoji, une phrase, et parfois une action. */
export function EtatVide({ emoji, titre, children, action }: { emoji: string; titre: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>{emoji}</span>
      <p className="font-titre text-lg font-extrabold">{titre}</p>
      {children && <div className="max-w-md text-sm text-gris">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
