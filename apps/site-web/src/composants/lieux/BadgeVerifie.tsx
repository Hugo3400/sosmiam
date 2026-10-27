import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * « Vérifié ✓ » (le lieu a un compte SOS Miam) ou « Lieu non vérifié » (ajouté par l'équipe ou un ambassadeur, sans
 * compte). docs/decisions.md, « Lieux vérifiés et non vérifiés ». `detail` : la phrase qui explique, à côté.
 */
export function BadgeVerifie({ verifie, detail = false, petit = false }: { verifie: boolean; detail?: boolean; petit?: boolean }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).badge;
  const taille = petit ? "px-2.5 py-1 text-xs" : "px-3 py-[5px] text-[13px]";
  return (
    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {verifie ? (
        <span className={`rounded-full border-2 border-encre bg-jaune font-bold text-encre ${taille}`}>{T.verifie}</span>
      ) : (
        <span className={`rounded-full border-2 border-dashed border-gris bg-creme font-bold text-gris ${taille}`}>{T.nonVerifie}</span>
      )}
      {detail && <span className="text-sm text-gris">{lierPonctuation(verifie ? T.detailVerifie : T.detailNonVerifie)}</span>}
    </p>
  );
}
