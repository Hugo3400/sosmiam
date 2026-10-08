import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** Donner son avis sur une visite validée (provisoire). */
export default function EcranDonnerAvis() {
  return (
    <EcranProvisoire
      emoji="💬"
      titre="Ton avis"
      texte="Bientôt, tu noteras ta visite ici, à tête reposée. Critique, c'est permis !"
    />
  );
}
