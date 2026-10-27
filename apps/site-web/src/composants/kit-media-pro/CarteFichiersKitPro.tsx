import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_KIT_MEDIA_PRO_PAR_LANGUE, type FichierKitPro, type TEXTES_KIT_MEDIA_PRO } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Un aperçu de la carte : un PNG du kit, servi par la route protégée (?apercu=1 : affiché, pas téléchargé). */
export type ApercuKitPro = { nom: string; description: string; largeur: number; hauteur: number };

type Props = {
  titre: string;
  texte: string;
  apercus: ApercuKitPro[];
  fichiers: FichierKitPro[];
  /** Poids de chaque fichier, par nom (« 160 Ko »), lu sur le disque par la page */
  poids: Record<string, string | null>;
};

/** Ce que dit un bouton : « le PDF A4 à imprimer », « le PNG du recto »… */
function decrireFichier(fichier: FichierKitPro, T: Traduction<typeof TEXTES_KIT_MEDIA_PRO>["fichiers"]): string {
  if (fichier.format === "PNG") return fichier.nom.includes("recto") ? T.pngRecto : fichier.nom.includes("verso") ? T.pngVerso : T.png;
  if (fichier.nom.includes("planche")) return T.planche;
  return T.pdf;
}

/**
 * Une carte du kit média pro : un ou deux aperçus (le recto et le verso du flyer), le titre, une phrase, et un bouton par
 * fichier. Des liens simples : le fichier arrive en téléchargement (Content-Disposition), JavaScript ou pas.
 */
export function CarteFichiersKitPro({ titre, texte, apercus, fichiers, poids }: Props) {
  const T = utiliserTextes(TEXTES_KIT_MEDIA_PRO_PAR_LANGUE).fichiers;
  return (
    <li className="flex flex-col overflow-hidden rounded-carte border-2 border-encre bg-white shadow-brut">
      <div className="flex h-72 justify-center gap-4 border-b-2 border-encre bg-creme p-4">
        {apercus.map((apercu) => (
          <img
            key={apercu.nom}
            src={`/kit-media-pro/${apercu.nom}?apercu=1`}
            alt={apercu.description}
            width={apercu.largeur}
            height={apercu.hauteur}
            loading="lazy"
            className="h-full w-auto min-w-0 border border-encre/20 object-contain shadow-brut"
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg leading-tight font-extrabold">{lierPonctuation(titre)}</h3>
          <p className="mt-1.5 text-gris">{lierPonctuation(texte)}</p>
        </div>
        <ul className="mt-auto grid gap-2.5">
          {fichiers.map((fichier) => (
            <li key={fichier.nom} className="flex flex-col items-start gap-1.5">
              <Bouton href={`/kit-media-pro/${fichier.nom}`} petit>
                {T.telecharger(decrireFichier(fichier, T))}
                <span className="sr-only">&nbsp;: {lierPonctuation(titre)}</span>
              </Bouton>
              <span className="text-sm text-gris">{[fichier.taille, poids[fichier.nom]].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
