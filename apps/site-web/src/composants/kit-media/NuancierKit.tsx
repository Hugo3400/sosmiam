import { BoutonCopier } from "~/composants/kit-media/BoutonCopier";
import { couleursKitMedia } from "~/contenus/kit-media";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Les couleurs de la marque : pastille, nom, code à copier et à quoi elle sert. */
export function NuancierKit() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {couleursKitMedia.map((couleur) => (
        <li key={couleur.nom} className="flex gap-4 rounded-carte border-2 border-encre bg-white p-4">
          <span aria-hidden="true" className="size-16 shrink-0 rounded-2xl border-2 border-encre" style={{ backgroundColor: couleur.hex }} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="leading-tight font-extrabold">{couleur.nom}</h3>
            <p className="font-mono text-sm font-semibold">{couleur.hex}</p>
            <p className="text-sm text-gris">{lierPonctuation(couleur.usage)}</p>
            <BoutonCopier texte={couleur.hex} libelle={`le code de la couleur ${couleur.nom}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}
