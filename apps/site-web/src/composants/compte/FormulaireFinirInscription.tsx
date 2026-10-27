import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FINIR_INSCRIPTION_PAR_LANGUE } from "~/contenus/finir-inscription";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE } from "~/contenus/inscription-compte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne } from "~/types/connexion-externe";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";
const noms = { apple: "Apple", google: "Google" } as const;

type Props = {
  fournisseur: FournisseurExterne;
  /** Pré-remplis : le prénom donné par Apple (une seule fois) ou Google ; l'e-mail du jeton, seulement affiché */
  prenom: string | null;
  email: string | null;
};

/**
 * « Finir ton inscription » après « Continuer avec Apple / Google » (action de routes/compte/finir-inscription.tsx) :
 * prénom pré-rempli, date de naissance (dès 18 ans), ville et conditions. Le jeton reste côté serveur, jamais dans la page.
 */
export function FormulaireFinirInscription({ fournisseur, prenom, email }: Props) {
  const T = utiliserTextes(TEXTES_FINIR_INSCRIPTION_PAR_LANGUE);
  const { creerMonCompte } = utiliserTextes(TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE);
  const { champs, conditions } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const lien = utiliserLienLangue();
  return (
    <FormulaireCompte nom="finir-inscription" bouton={creerMonCompte} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      {email && (
        <p className="mb-6 rounded-2xl bg-creme px-4 py-3">
          {lierPonctuation(T.lieA(noms[fournisseur]))}<strong className="break-all">{email}</strong>.
        </p>
      )}
      <div className="grid gap-5">
        <ChampTexte nom="prenom" libelle={champs.prenom} autoComplete="given-name" maximum={40} valeur={prenom ?? undefined} />
        <ChampTexte
          nom="dateNaissance"
          libelle={champs.dateNaissance}
          type="date"
          autoComplete="bday"
          aide={lierPonctuation(T.aideDateNaissance)}
        />
        <ChampTexte nom="ville" libelle={T.ville} autoComplete="address-level2" maximum={80} aide={T.aideVille} />
      </div>
      <div className="mt-7">
        <CaseACocher nom="cgu">
          {conditions.jAccepte}
          <a href={`https://${site.adresse}${lien("/cgu")}`} target="_blank" rel="noopener" className={classeLien}>
            {conditions.lien}<span className="sr-only">{conditions.nouvelOnglet}</span>
          </a>
        </CaseACocher>
      </div>
      <p className="mt-5 text-sm text-gris">
        {lierPonctuation(conditions.tesDonnees)}
        <a href={`https://${site.adresse}${lien("/confidentialite#connexion-apple-google")}`} target="_blank" rel="noopener" className={classeLien}>
          {conditions.confidentialite}<span className="sr-only">{conditions.nouvelOnglet}</span>
        </a>.
      </p>
    </FormulaireCompte>
  );
}
