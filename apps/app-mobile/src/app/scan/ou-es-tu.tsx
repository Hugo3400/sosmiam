import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** « Tu es chez qui ? » (provisoire : remplacé par l'écran de demande d'addition). */
export default function EcranOuEsTu() {
  return (
    <EcranProvisoire
      emoji="🧾"
      titre="Tu es chez qui ?"
      texte="Encore quelques minutes de cuisson : bientôt, tu choisiras ici le lieu où tu manges, et tu demanderas l'addition en un geste."
    />
  );
}
