import { EcranBientot } from "~/composants/interface/EcranBientot";
import { EcranInvite } from "~/composants/invite/EcranInvite";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/** Onglet « Scan » (provisoire). Sans compte, on montre ce qui t'attend. */
export default function OngletScan() {
  const { invite } = utiliserProfil();
  if (invite) {
    return (
      <EcranInvite
        raison="scan"
        emoji="📷"
        titre="Ta visite compte"
        texte="Le scan arrive bientôt dans l'app. Crée ton compte d'ici là : le jour J, tu n'auras plus qu'à scanner."
        avantages={[
          "Valider ta visite en payant, en un scan",
          "Gagner des points (+15 par visite, +25 pendant un SOS)",
          "Des tampons sur la carte de fidélité des lieux (la récompense, c'est eux qui la choisissent)",
        ]}
      />
    );
  }
  return <EcranBientot emoji="📷" titre="Scan" texte="Scanne ton ticket ou demande l'addition dans l'app : ta visite est vérifiée." />;
}
