import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";
import { utiliserModes } from "~/hooks/utiliser-modes";

/** Espace du mode ambassadeur (provisoire). */
export default function EcranEspaceAmbassadeur() {
  const { revenirAuModePerso } = utiliserModes();
  return (
    <EcranProvisoire
      emoji="🤝"
      titre="Espace ambassadeur"
      texte="Tes missions, les avis à relire et les messages de l'équipe arrivent ici très vite. Merci de veiller sur les lieux du coin !"
      action={{ libelle: "Revenir à mon SOS Miam", onPress: revenirAuModePerso }}
    />
  );
}
