import { BlocsTexte } from "~/composants/interface/BlocsTexte";
import type { BlocTexte } from "~/contenus/type-bloc-texte";

/** L'encadré « En bref » d'une page légale : l'essentiel avant le détail (ancre « en-bref »). */
export function EnBrefLegal({ blocs }: { blocs: BlocTexte[] }) {
  return (
    <section id="en-bref" aria-labelledby="en-bref-titre" className="mt-8 rounded-carte border-2 border-encre bg-jaune-clair p-5 shadow-brut md:p-6">
      <h2 id="en-bref-titre" className="mb-3 text-xl font-extrabold">
        <span aria-hidden="true">⚡ </span>En bref
      </h2>
      <div className="grid gap-3 [&_strong]:text-encre">
        <BlocsTexte blocs={blocs} />
      </div>
    </section>
  );
}
