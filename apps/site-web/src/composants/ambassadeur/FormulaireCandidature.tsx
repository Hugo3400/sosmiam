import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE } from "~/contenus/candidature-fondateur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Code INSEE de la commune choisie juste avant (champ caché) : l'API en déduit la ville ou le département */
  communeCode: string;
};

/** Candidature « fondateur » pour la commune choisie (action de routes/ambassadeur/fondateur.tsx). */
export function FormulaireCandidature({ communeCode }: Props) {
  const T = utiliserTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE).formulaire;
  const envies = Object.entries(T.envies).map(([valeur, libelle]) => ({ valeur, libelle }));
  return (
    <FormulaireCompte nom="candidature" bouton={T.bouton} piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <input type="hidden" name="communeCode" value={communeCode} />
      <div className="grid gap-6">
        <ChampTexte
          nom="pepites"
          libelle={T.pepites}
          aide={T.aidePepites}
          maximum={1500}
          lignes={6}
        />
        {/* Au moins une case (comme l'API) : un groupe de cases ne peut pas être marqué « requis », l'aide le dit donc */}
        <ChoixMultiples nom="envies" legende={T.legendeEnvies} aide={T.aideEnvies} type="checkbox" options={envies} />
        <ChampTexte
          nom="reseaux"
          libelle={T.reseaux}
          facultatif
          maximum={200}
          aide={T.aideReseaux}
        />
        <ChampTexte
          nom="motivation"
          libelle={lierPonctuation(T.motivation)}
          aide={T.aideMotivation}
          maximum={600}
          lignes={4}
        />
        <CaseACocher nom="partantRencontre" facultatif>
          {lierPonctuation(T.rencontre)}
        </CaseACocher>
        <ChampTexte nom="connuPar" libelle={lierPonctuation(T.connuPar)} facultatif maximum={120} />
      </div>
    </FormulaireCompte>
  );
}
