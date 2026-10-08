import type { ReactNode } from "react";

/** Une partie de la page « Mon compte » (Mes infos, Mon mot de passe…) : un titre et son contenu, dans une carte. */
export function PartieCompte({ id, titre, children }: { id: string; titre: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <h2 id={id} className="mb-5 text-2xl font-extrabold">{titre}</h2>
      {children}
    </section>
  );
}
