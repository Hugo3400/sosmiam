import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";
import { utiliserModes } from "~/hooks/utiliser-modes";

/** Comptoir du mode pro (provisoire). */
export default function EcranComptoir() {
  const { lieuPro, revenirAuModePerso } = utiliserModes();
  return (
    <EcranProvisoire
      emoji="🧑‍🍳"
      titre="Comptoir"
      texte={`Les additions à valider et le QR du comptoir${lieuPro ? ` de ${lieuPro.nom}` : ""} arrivent ici très vite. Le tablier est déjà noué.`}
      action={{ libelle: "Revenir à mon SOS Miam", onPress: revenirAuModePerso }}
    />
  );
}
