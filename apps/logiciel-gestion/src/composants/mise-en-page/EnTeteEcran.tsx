import type { ReactNode } from "react";

/** Titre d'un écran, une phrase d'explication, et ses actions à droite. */
export function EnTeteEcran({ titre, sousTitre, actions }: { titre: string; sousTitre?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight">{titre}</h1>
        {sousTitre && <p className="mt-1 max-w-2xl text-gris">{sousTitre}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
