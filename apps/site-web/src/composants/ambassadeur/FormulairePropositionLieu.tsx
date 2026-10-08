import { ChoixTypeLieu } from "~/composants/ambassadeur/ChoixTypeLieu";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { champsLieu } from "~/contenus/demande-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Les champs du lieu de « J'inscris mon lieu » (mêmes noms et longueurs que l'API), vus par l'ambassadeur qui le propose
const libelles: Record<string, { libelle: string; aide?: string }> = {
  description: { libelle: "Pourquoi ce lieu ?", aide: "Ce qui le rend unique, l'ambiance, pourquoi il mérite plus de monde (20 caractères au moins)." },
};

/**
 * Formulaire « Proposer un lieu » de l'espace (action de routes/ambassadeur/proposer-un-lieu.tsx). Pas de remplissage
 * automatique : le lieu n'est pas la personne qui le propose.
 */
export function FormulairePropositionLieu() {
  return (
    <FormulaireCompte nom="proposition" bouton="Envoyer ma proposition" piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
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
