import { BlocsTexte } from "~/composants/interface/BlocsTexte";
import { TEXTES_CADRE_LEGAL_PAR_LANGUE } from "~/contenus/legal/cadre-legal";
import type { BlocTexte } from "~/contenus/type-bloc-texte";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** L'encadré « En bref » d'une page légale : l'essentiel avant le détail (ancre « en-bref »). */
export function EnBrefLegal({ blocs }: { blocs: BlocTexte[] }) {
  const T = utiliserTextes(TEXTES_CADRE_LEGAL_PAR_LANGUE);
  return (
    <section id="en-bref" aria-labelledby="en-bref-titre" className="mt-8 rounded-carte border-2 border-encre bg-jaune-clair p-5 shadow-brut md:p-6">
      <h2 id="en-bref-titre" className="mb-3 text-xl font-extrabold">
        <span aria-hidden="true">⚡ </span>{T.enBref}
      </h2>
      <div className="grid gap-3 [&_strong]:text-encre">
        <BlocsTexte blocs={blocs} />
      </div>
    </section>
  );
}
