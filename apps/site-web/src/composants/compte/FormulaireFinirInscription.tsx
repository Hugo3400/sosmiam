import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
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
  return (
    <FormulaireCompte nom="finir-inscription" bouton="Créer mon compte" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      {email && (
        <p className="mb-6 rounded-2xl bg-creme px-4 py-3">
          {lierPonctuation(`Ton compte SOS Miam sera lié à ${noms[fournisseur]}, avec l'adresse `)}<strong className="break-all">{email}</strong>.
        </p>
      )}
      <div className="grid gap-5">
        <ChampTexte nom="prenom" libelle="Ton prénom (ou un surnom)" autoComplete="given-name" maximum={40} valeur={prenom ?? undefined} />
        <ChampTexte
          nom="dateNaissance"
          libelle="Ta date de naissance"
          type="date"
          autoComplete="bday"
          aide={lierPonctuation("SOS Miam, c'est dès 18 ans. Elle est gardée chiffrée avec ton compte, comme pour un compte créé dans l'app.")}
        />
        <ChampTexte nom="ville" libelle="Ta ville" autoComplete="address-level2" maximum={80} aide="Pour te montrer les lieux du coin dans l'app." />
      </div>
      <div className="mt-7">
        <CaseACocher nom="cgu">
          {"J'accepte les "}
          <a href="https://sosmiam.fr/cgu" target="_blank" rel="noopener" className={classeLien}>
            conditions d'utilisation<span className="sr-only"> (s'ouvre dans un nouvel onglet)</span>
          </a>
        </CaseACocher>
      </div>
      <p className="mt-5 text-sm text-gris">
        {lierPonctuation("Ce qu'on fait de tes données : ")}
        <a href="https://sosmiam.fr/confidentialite#connexion-apple-google" target="_blank" rel="noopener" className={classeLien}>
          confidentialité<span className="sr-only"> (s'ouvre dans un nouvel onglet)</span>
        </a>.
      </p>
    </FormulaireCompte>
  );
}
