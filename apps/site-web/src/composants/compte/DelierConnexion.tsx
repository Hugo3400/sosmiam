import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_MES_CONNEXIONS_PAR_LANGUE } from "~/contenus/mes-connexions";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { MesConnexions } from "~/types/mes-connexions";

const noms = { apple: "Apple", google: "Google" } as const;
const autres = { apple: "google", google: "apple" } as const;

/**
 * « Délier » Apple ou Google, sous sa ligne : avec le mot de passe si le compte en a un ; sinon en se reconnectant avec
 * l'AUTRE fournisseur (celui qui restera). Jamais la dernière façon de se connecter : une explication à la place.
 */
export function DelierConnexion({ fournisseur, connexions }: { fournisseur: FournisseurExterne; connexions: MesConnexions }) {
  const T = utiliserTextes(TEXTES_MES_CONNEXIONS_PAR_LANGUE);
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const nom = noms[fournisseur];
  const autre = autres[fournisseur];
  if (!connexions.motDePasse && !connexions[autre]) {
    return <p className="text-gris">{lierPonctuation(T.seuleFacon(noms[autre], nom))}</p>;
  }
  if (!connexions.motDePasse && !connexions.actifs[autre]) {
    return <p className="text-gris">{lierPonctuation(T.pourDelier(nom))}</p>;
  }
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border-2 border-encre bg-white px-[18px] py-2 text-[.9rem] font-semibold focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre [&::-webkit-details-marker]:hidden">
        {T.delier}<span className="sr-only">{T.monCompte(nom)}</span>
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4">
        {connexions.motDePasse ? (
          <FormulaireCompte nom={`delier-${fournisseur}`} bouton={T.delierFournisseur(nom)} boutonEnvoi={T.enCoursDelier}>
            <p className="mb-4">{lierPonctuation(T.plusAvec(nom))}</p>
            <ChampTexte nom="motDePasse" libelle={champs.motDePasseConfirmer} type="password" autoComplete="current-password" />
          </FormulaireCompte>
        ) : (
          <>
            <p className="mb-4">{lierPonctuation(T.reconnecteAvec(noms[autre]))}</p>
            <div className="max-w-sm">
              <BoutonFournisseur fournisseur={autre} adresse={construireAdresseDepart(autre, connexions.depart, null, "delier")} />
            </div>
          </>
        )}
      </div>
    </details>
  );
}
