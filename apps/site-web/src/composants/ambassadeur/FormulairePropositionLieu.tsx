import { ChoixTypeLieu } from "~/composants/ambassadeur/ChoixTypeLieu";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { STRUCTURE_DEMANDE_LIEU, TEXTES_DEMANDE_LIEU_PAR_LANGUE } from "~/contenus/demande-lieu";
import { TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE } from "~/contenus/proposer-un-lieu";
import { assemblerDemandeLieu } from "~/fonctions/lieux/assembler-demande-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Formulaire « Proposer un lieu » de l'espace (action de routes/ambassadeur/proposer-un-lieu.tsx). Pas de remplissage
 * automatique : le lieu n'est pas la personne qui le propose.
 */
export function FormulairePropositionLieu() {
  const T = utiliserTextes(TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE).formulaire;
  const { champsLieu } = assemblerDemandeLieu(STRUCTURE_DEMANDE_LIEU, utiliserTextes(TEXTES_DEMANDE_LIEU_PAR_LANGUE));
  const libelles: Record<string, { libelle: string; aide?: string }> = { description: T.description };
  return (
    <FormulaireCompte nom="proposition" bouton={T.bouton} piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <ChoixTypeLieu />
      <div className="grid gap-5 sm:grid-cols-2">
        {champsLieu.map((champ) => (
          <ChampTexte
            key={champ.nom}
            nom={champ.nom}
            libelle={lierPonctuation(libelles[champ.nom]?.libelle ?? champ.libelle)}
            aide={libelles[champ.nom]?.aide ?? champ.aide}
            facultatif={!champ.obligatoire}
            maximum={champ.maximum}
            autoComplete="off"
            exemple={champ.exemple}
            type={champ.type === "url" ? "url" : "text"}
            inputMode={champ.type === "url" ? "url" : undefined}
            lignes={champ.type === "zone" ? 5 : undefined}
            className={champ.type === "zone" ? "sm:col-span-2" : ""}
          />
        ))}
      </div>
    </FormulaireCompte>
  );
}
