import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** Une visite : code de l'addition, réponse du lieu, célébration (provisoire). */
export default function EcranVisite() {
  return (
    <EcranProvisoire
      emoji="🧾"
      titre="Ta visite"
      texte="Ici s'afficheront ton code d'addition, la réponse du lieu, et une petite fête quand c'est validé."
    />
  );
}
