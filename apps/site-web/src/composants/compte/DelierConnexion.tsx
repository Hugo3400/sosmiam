import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { MesConnexions } from "~/types/mes-connexions";

const noms = { apple: "Apple", google: "Google" } as const;
const autres = { apple: "google", google: "apple" } as const;

/**
 * « Délier » Apple ou Google, sous sa ligne : avec le mot de passe si le compte en a un ; sinon en se reconnectant avec
 * l'AUTRE fournisseur (celui qui restera). Jamais la dernière façon de se connecter : une explication à la place.
 */
export function DelierConnexion({ fournisseur, connexions }: { fournisseur: FournisseurExterne; connexions: MesConnexions }) {
  const nom = noms[fournisseur];
  const autre = autres[fournisseur];
  if (!connexions.motDePasse && !connexions[autre]) {
    return <p className="text-gris">{lierPonctuation(`C'est ta seule façon de te connecter : ajoute un mot de passe ou relie ${noms[autre]} avant de pouvoir délier ${nom}.`)}</p>;
  }
  if (!connexions.motDePasse && !connexions.actifs[autre]) {
    return <p className="text-gris">{lierPonctuation(`Pour délier ${nom}, ajoute d'abord un mot de passe.`)}</p>;
  }
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border-2 border-encre bg-white px-[18px] py-2 text-[.9rem] font-semibold focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre [&::-webkit-details-marker]:hidden">
        Délier<span className="sr-only"> mon compte {nom}</span>
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4">
        {connexions.motDePasse ? (
          <FormulaireCompte nom={`delier-${fournisseur}`} bouton={`Délier ${nom}`} boutonEnvoi="On délie…">
            <p className="mb-4">{lierPonctuation(`Tu ne pourras plus te connecter avec ${nom}. Ton e-mail et ton mot de passe, eux, marchent toujours.`)}</p>
            <ChampTexte nom="motDePasse" libelle="Ton mot de passe, pour confirmer" type="password" autoComplete="current-password" />
          </FormulaireCompte>
        ) : (
          <>
            <p className="mb-4">{lierPonctuation(`Ton compte n'a pas de mot de passe : pour confirmer, reconnecte-toi avec ${noms[autre]}. C'est lui qui restera ta façon de te connecter.`)}</p>
            <div className="max-w-sm">
              <BoutonFournisseur fournisseur={autre} adresse={construireAdresseDepart(autre, connexions.depart, null, "delier")} />
            </div>
          </>
        )}
      </div>
    </details>
  );
}
