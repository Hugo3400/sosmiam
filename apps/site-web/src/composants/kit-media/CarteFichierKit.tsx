import { Bouton } from "~/composants/interface/Bouton";
import { fichiersKitMedia, type VisuelKit } from "~/contenus/kit-media";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visuel: VisuelKit;
  /** Poids de chaque fichier, par nom (« 160 Ko »), lu sur le disque par la page */
  poids: Record<string, string | null>;
};

/**
 * Une carte de téléchargement du kit média : l'aperçu (servi par la route protégée, en SVG quand il existe, plus léger),
 * le titre, et un bouton par format. Des liens simples : le fichier arrive en téléchargement (Content-Disposition).
 */
export function CarteFichierKit({ visuel, poids }: Props) {
  const fichiers = fichiersKitMedia.filter((fichier) => fichier.visuel === visuel.id);
  const apercu = fichiers.find((fichier) => fichier.format === "SVG") ?? fichiers[0];
  return (
    <li className="flex flex-col overflow-hidden rounded-carte border-2 border-encre bg-white shadow-brut">
      <div className={`h-56 border-b-2 border-encre p-4 ${visuel.fondSombre ? "bg-encre" : "bg-creme"}`}>
        <img
          src={`/kit-media/${apercu.nom}?apercu=1`}
          alt={visuel.description}
          width={visuel.largeur}
          height={visuel.hauteur}
          loading="lazy"
          className="size-full object-contain"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="text-lg leading-tight font-extrabold">{lierPonctuation(visuel.titre)}</h3>
        <ul className="mt-auto grid gap-2.5">
          {fichiers.map((fichier) => (
            <li key={fichier.nom} className="flex flex-col items-start gap-1.5">
              <Bouton href={`/kit-media/${fichier.nom}`} petit>
                Télécharger le {fichier.format}
                <span className="sr-only">&nbsp;: {lierPonctuation(visuel.titre)}</span>
              </Bouton>
              <span className="text-sm text-gris">
                {[fichier.format === "SVG" ? "net à toutes les tailles" : fichier.taille, poids[fichier.nom]].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
