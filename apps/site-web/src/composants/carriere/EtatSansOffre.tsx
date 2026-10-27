import type { TypeOffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { creerLienEcrireNous } from "~/fonctions/carriere/creer-lien-ecrire-nous";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { cas: "vide" | "filtre-vide" | "indisponible"; type?: TypeOffreCarriere };

export function EtatSansOffre({ cas, type }: Props) {
  const T = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const textes = {
    vide: T.etats.vide,
    "filtre-vide": { titre: type ? T.types[type].aucuneOffre : T.etats.vide.titre, texte: T.etats.filtreVide },
    indisponible: T.etats.indisponible,
  }[cas];
  return (
    <div className="mt-8 flex flex-col items-center rounded-carte border-2 border-dashed border-encre bg-white px-6 py-10 text-center">
      <Mascotte expression={cas === "indisponible" ? "surprise" : "clin"} className="h-24 w-24" />
      <h3 className="mt-4 text-2xl font-extrabold">{lierPonctuation(textes.titre)}</h3>
      <p className="mt-2 max-w-md text-gris">{lierPonctuation(textes.texte)}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {cas === "filtre-vide" && <Bouton vers={lien("/carriere#offres")} variante="blanc">{T.etats.voirToutes}</Bouton>}
        <Bouton href={creerLienEcrireNous(T.sujetMail)}>{T.ecrisNous}</Bouton>
      </div>
    </div>
  );
}
