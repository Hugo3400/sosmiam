import type { ReactNode } from "react";

/** Une partie de l'historique d'un lieu : son titre, son nombre, et ses lignes (ou « Rien pour l'instant »). */
export function PartieHistorique({ titre, nombre, children }: { titre: string; nombre: number; children: ReactNode }) {
  return (
    <section className="grid gap-1.5">
      <h3 className="text-sm font-extrabold">{titre} <span className="font-normal text-gris">({nombre})</span></h3>
      {nombre === 0 ? <p className="text-[13px] text-gris">Rien pour l'instant.</p> : <ul className="grid gap-1">{children}</ul>}
    </section>
  );
}
