import type { TypeOffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lienEcrireNous, typesOffre } from "~/contenus/carriere";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = { cas: "vide" | "filtre-vide" | "indisponible"; type?: TypeOffreCarriere };

export function EtatSansOffre({ cas, type }: Props) {
  const pluriel = typesOffre.find((t) => t.valeur === type)?.pluriel ?? "";
  const textes = {
    vide: { titre: "Pas d'offre en ce moment", texte: "Repasse bientôt, ou écris-nous : on lit tous les messages, même ceux qui ne répondent à aucune annonce." },
    "filtre-vide": { titre: `Pas d'offre ${pluriel} en ce moment`, texte: "Jette un œil aux autres offres, ou écris-nous si tu as une idée en tête." },
    indisponible: { titre: "Les offres font une petite sieste", texte: "Notre serveur ne répond pas pour l'instant. Repasse dans un instant, ou écris-nous." },
  }[cas];
  return (
    <div className="mt-8 flex flex-col items-center rounded-carte border-2 border-dashed border-encre bg-white px-6 py-10 text-center">
      <Mascotte expression={cas === "indisponible" ? "surprise" : "clin"} className="h-24 w-24" />
      <h3 className="mt-4 text-2xl font-extrabold">{lierPonctuation(textes.titre)}</h3>
      <p className="mt-2 max-w-md text-gris">{lierPonctuation(textes.texte)}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {cas === "filtre-vide" && <Bouton vers="/carriere#offres" variante="blanc">Voir toutes les offres</Bouton>}
        <Bouton href={lienEcrireNous}>Écris-nous</Bouton>
      </div>
    </div>
  );
}
