import { Bouton } from "~/composants/interface/Bouton";
import type { FichierMaquette, Maquette } from "~/contenus/maquettes-kits";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  maquette: Maquette;
  /** Adresse des fichiers du kit : « /kit-media », « /kit-media-pro » ou « /kit-media-lieux » */
  prefixe: string;
  /** Poids de chaque fichier, par nom (« 1,2 Mo »), lu sur le disque par la page */
  poids: Record<string, string | null>;
};

/** Ce que dit un bouton : « le PDF A3 », « le PNG », « la série (ZIP) » */
function decrireFichier(fichier: FichierMaquette): string {
  if (fichier.format === "PDF") return `le PDF ${fichier.taille}`;
  if (fichier.format === "ZIP") return "la série (ZIP)";
  return "le PNG";
}

/**
 * Une maquette dans un kit média (affiche, imprimé, série de visuels réseaux) : ses aperçus, son titre, une phrase et un
 * bouton par fichier. Des liens simples : le fichier arrive en téléchargement, JavaScript ou pas.
 */
export function CarteMaquetteKit({ maquette, prefixe, poids }: Props) {
  return (
    <li className="flex flex-col overflow-hidden rounded-carte border-2 border-encre bg-white shadow-brut">
      <div className="flex h-72 items-center justify-center gap-3 border-b-2 border-encre bg-creme p-4">
        {maquette.apercus.map((vu) => (
          <img
            key={vu.nom}
            src={`${prefixe}/${vu.nom}?apercu=1`}
            alt={vu.description}
            loading="lazy"
            className="max-h-full w-auto min-w-0 object-contain"
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg leading-tight font-extrabold">{lierPonctuation(maquette.titre)}</h3>
          <p className="mt-1.5 text-gris">{lierPonctuation(maquette.texte)}</p>
        </div>
        <ul className="mt-auto grid gap-2.5">
          {maquette.fichiers.map((fichier) => (
            <li key={fichier.nom} className="flex flex-col items-start gap-1.5">
              <Bouton href={`${prefixe}/${fichier.nom}`} petit>
                Télécharger {decrireFichier(fichier)}
                <span className="sr-only">&nbsp;: {lierPonctuation(maquette.titre)}</span>
              </Bouton>
              <span className="text-sm text-gris">{[fichier.format === "PDF" ? null : fichier.taille, poids[fichier.nom]].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
