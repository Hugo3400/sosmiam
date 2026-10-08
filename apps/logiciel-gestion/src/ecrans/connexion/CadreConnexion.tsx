import type { ReactNode } from "react";

/** Cadre des écrans d'avant la connexion : la bouée, un titre, et le contenu dans une carte. */
export function CadreConnexion({ titre, sousTitre, children }: { titre: string; sousTitre?: ReactNode; children: ReactNode }) {
  return (
    <main className="grid min-h-full place-items-center bg-jaune p-6">
      <div className="w-full max-w-[520px]">
        <div className="mb-5 flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-12" />
          <div>
            <p className="font-titre text-2xl leading-none font-extrabold">SOS Miam</p>
            <p className="text-sm font-semibold">Logiciel de gestion</p>
          </div>
        </div>
        <section className="rounded-[24px] border-2 border-encre bg-white p-7 shadow-brut">
          <h1 className="text-2xl font-extrabold">{titre}</h1>
          {sousTitre && <p className="mt-2 text-gris">{sousTitre}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
