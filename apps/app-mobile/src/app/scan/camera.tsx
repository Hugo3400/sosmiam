import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** Scanner du QR du comptoir (provisoire). */
export default function EcranCameraScan() {
  return (
    <EcranProvisoire
      emoji="📷"
      titre="Le scanner du comptoir"
      texte="Bientôt, tu viseras ici le QR que te montre l'équipe au moment de payer. Et hop, ta visite compte !"
    />
  );
}
