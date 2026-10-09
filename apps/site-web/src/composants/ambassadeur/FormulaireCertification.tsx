import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampCommuneFormulaire } from "~/composants/compte/ChampCommuneFormulaire";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { AIDE_MAX, STRUCTURE_MAX, engagementCertifie, enviesCertification, profilsCertifie } from "~/contenus/ambassadeur-certifie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CommuneFondateurs } from "~/types/compte";

type Props = {
  /** Plusieurs communes correspondent à « Ta ville » (réponse de l'action) : la liste où choisir */
  choixCommunes?: CommuneFondateurs[] | null;
  /** Change à chaque réponse qui touche à la commune : « Ta ville » repart alors de ce que l'action a renvoyé */
  cleCommune: string;
};

/** Candidature « ambassadeur certifié » (action de routes/ambassadeur/certification.tsx), utilisable sans JavaScript. */
export function FormulaireCertification({ choixCommunes, cleCommune }: Props) {
  return (
    <FormulaireCompte nom="certification" bouton="Envoyer ma candidature" piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <div className="grid gap-6">
        <ChoixMultiples nom="profil" legende={lierPonctuation("Tu es plutôt…")} type="radio" options={profilsCertifie} />
        <ChampTexte
          nom="structure"
          libelle="Nom de ta structure ou de ton lieu"
          facultatif
          maximum={STRUCTURE_MAX}
          aide={lierPonctuation("Il s'affichera avec ton prénom sur les fiches des lieux que tu aides : « Marie, pour l'asso Les Gourmands du 11e ».")}
        />
        <ChampCommuneFormulaire
          key={cleCommune}
          libelle="Ta ville"
          aide="Là où tu vis : tape son nom ou ton code postal, puis choisis-la."
          choix={choixCommunes}
        />
        <ChampTexte
          nom="aide"
          libelle={lierPonctuation("Comment tu aides déjà les lieux ?")}
          aide="Une fiche remplie, des photos, un coup de main au marché, une asso de quartier… raconte !"
          maximum={AIDE_MAX}
          lignes={5}
        />
        {/* Au moins une case (comme l'API) : un groupe de cases ne peut pas être marqué « requis », l'aide le dit donc */}
        <ChoixMultiples
          nom="envies"
          legende="Ce que tu aimerais faire"
          aide="Coche tout ce qui te tente (une case au moins)."
          type="checkbox"
          options={enviesCertification}
        />
        <CaseACocher nom="engagementGratuit">{lierPonctuation(engagementCertifie)}</CaseACocher>
      </div>
    </FormulaireCompte>
  );
}
