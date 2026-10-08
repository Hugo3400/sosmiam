import { AccueilScan } from "~/composants/scan/AccueilScan";
import { InvitationCompteScan } from "~/composants/scan/InvitationCompteScan";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/** Onglet « Scan » : valider ses visites en payant. Sans compte, ce qui t'attend et de quoi t'inscrire. */
export default function OngletScan() {
  const { invite } = utiliserProfil();
  return invite ? <InvitationCompteScan /> : <AccueilScan />;
}
