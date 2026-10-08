import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Son prénom, dans le texte */
  prenom: string;
  /** Vrai si la règle te permet de lui demander à la suivre (le bouton « Suivre » est affiché juste au-dessus) */
  peutDemander: boolean;
};

/**
 * L'encadré d'un profil qu'on ne peut pas voir en entier (compte privé, ou réservé à sa bande). Le même texte pour les deux,
 * pour que rien ne révèle l'âge de la personne. Lu d'un seul tenant par VoiceOver.
 */
export function EncadreComptePrive({ prenom, peutDemander }: Props) {
  const texte = `Les lieux, les listes et les abonnés de ${prenom} sont réservés à ses abonnés et à sa bande.`;
  const suite = peutDemander ? "Touche « Suivre » : ça lui envoie une demande." : "Pour voir son profil, ajoutez-vous en vrai, par lien ou QR code.";

  return (
    <View accessible accessibilityLabel={lierPonctuation(`Compte privé. ${texte} ${suite}`)} className="gap-1.5 rounded-carte border-2 border-encre bg-white p-4">
      <Text className="font-titre-gras text-lg text-encre">🔒 Compte privé</Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>
      <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(suite)}</Text>
    </View>
  );
}
