import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampCommuneFormulaire } from "~/composants/compte/ChampCommuneFormulaire";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { AIDE_MAX, STRUCTURE_MAX, TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE } from "~/contenus/ambassadeur-certifie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CommuneFondateurs } from "~/types/compte";

type Props = {
  /** Plusieurs communes correspondent à « Ta ville » (réponse de l'action) : la liste où choisir */
  choixCommunes?: CommuneFondateurs[] | null;
  /** Change à chaque réponse qui touche à la commune : « Ta ville » repart alors de ce que l'action a renvoyé */
  cleCommune: string;
};

/** Candidature « ambassadeur certifié » (action de routes/ambassadeur/certification.tsx), utilisable sans JavaScript. */
export function FormulaireCertification({ choixCommunes, cleCommune }: Props) {
  const T = utiliserTextes(TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE);
  const F = T.formulaire;
  const profils = Object.entries(T.profils).map(([valeur, libelle]) => ({ valeur, libelle }));
  const envies = Object.entries(T.envies).map(([valeur, libelle]) => ({ valeur, libelle }));
  return (
    <FormulaireCompte nom="certification" bouton={F.bouton} piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <div className="grid gap-6">
        <ChoixMultiples nom="profil" legende={lierPonctuation(F.profil)} type="radio" options={profils} />
        <ChampTexte
          nom="structure"
          libelle={F.structure}
          facultatif
          maximum={STRUCTURE_MAX}
          aide={lierPonctuation(F.aideStructure)}
        />
        <ChampCommuneFormulaire
          key={cleCommune}
          libelle={F.ville}
          aide={F.aideVille}
          choix={choixCommunes}
        />
        <ChampTexte
          nom="aide"
          libelle={lierPonctuation(F.aide)}
          aide={F.aideAide}
          maximum={AIDE_MAX}
          lignes={5}
        />
        {/* Au moins une case (comme l'API) : un groupe de cases ne peut pas être marqué « requis », l'aide le dit donc */}
        <ChoixMultiples
          nom="envies"
          legende={F.envies}
          aide={F.aideEnvies}
          type="checkbox"
          options={envies}
        />
        <CaseACocher nom="engagementGratuit">{lierPonctuation(T.engagement)}</CaseACocher>
      </div>
    </FormulaireCompte>
  );
}
