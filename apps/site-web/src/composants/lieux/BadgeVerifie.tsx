import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * « Vérifié ✓ » (le lieu a un compte SOS Miam) ou « Lieu non vérifié » (ajouté par l'équipe ou un ambassadeur, sans
 * compte). docs/decisions.md, « Lieux vérifiés et non vérifiés ». `detail` : la phrase qui explique, à côté.
 */
export function BadgeVerifie({ verifie, detail = false }: { verifie: boolean; detail?: boolean }) {
  if (verifie) {
    return (
      <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-full border-2 border-encre bg-encre px-3 py-1 text-sm font-bold text-jaune">Vérifié ✓</span>
        {detail && <span className="text-sm text-gris">{lierPonctuation("Ce lieu a un compte SOS Miam : c'est lui qui tient sa fiche.")}</span>}
      </p>
    );
  }
  return (
    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="rounded-full border-2 border-dashed border-encre bg-creme px-3 py-1 text-sm font-bold">Lieu non vérifié</span>
      {detail && <span className="text-sm text-gris">{lierPonctuation("Il n'a pas encore de compte SOS Miam.")}</span>}
    </p>
  );
}
