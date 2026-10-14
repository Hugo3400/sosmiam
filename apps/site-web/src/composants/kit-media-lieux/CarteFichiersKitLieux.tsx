import { Bouton } from "~/composants/interface/Bouton";
import type { FichierKitLieux, VisuelKitLieux } from "~/contenus/kit-media-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  titre: string;
  texte: string;
  /** Les visuels de la carte (une story et un post, ou un seul fichier) : un aperçu chacun */
  visuels: VisuelKitLieux[];
  fichiers: FichierKitLieux[];
  /** Poids de chaque fichier, par nom (« 160 Ko »), lu sur le disque par la page */
  poids: Record<string, string | null>;
  /** Aperçu sur fond sombre (le logo crème) */
  fondSombre?: boolean;
};

/** Ce que dit un bouton : « le PDF à imprimer », « le PNG de la story »… */
function decrireFichier(fichier: FichierKitLieux): string {
  if (fichier.format === "PDF") return "le PDF à imprimer";
  if (fichier.nom.startsWith("story-")) return "le PNG de la story";
  if (fichier.nom.startsWith("post-")) return "le PNG du post";
  return "le PNG";
}

/**
 * Une carte du kit média des lieux : les aperçus, le titre, une phrase, et un bouton par fichier. Des liens simples : le
 * fichier arrive en téléchargement (Content-Disposition), JavaScript ou pas.
 */
export function CarteFichiersKitLieux({ titre, texte, visuels, fichiers, poids, fondSombre = false }: Props) {
  return (
    <li className="flex flex-col overflow-hidden rounded-carte border-2 border-encre bg-white shadow-brut">
      <div className={`flex h-72 items-center justify-center gap-4 border-b-2 border-encre p-4 ${fondSombre ? "bg-encre" : "bg-creme"}`}>
        {visuels.map((visuel) => (
          <img
            key={visuel.id}
            src={`/kit-media-lieux/${visuel.id}.png?apercu=1`}
            alt={visuel.description}
            width={visuel.format.largeur}
            height={visuel.format.hauteur}
            loading="lazy"
            className="max-h-full w-auto min-w-0 object-contain"
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
              <Bouton href={`/kit-media-lieux/${fichier.nom}`} petit>
                Télécharger {decrireFichier(fichier)}
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
