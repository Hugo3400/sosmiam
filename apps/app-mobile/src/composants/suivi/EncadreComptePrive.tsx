import { Text, View } from "react-native";

import { eliderDe } from "~/fonctions/texte/elider-de";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Son prénom, dans le texte */
  prenom: string;
  /** Ta demande est partie et attend sa réponse (le bouton, au-dessus, affiche « Demandé ») */
  demandeEnvoyee?: boolean;
  /** Son profil t'est ouvert, mais pas ses abonnés ni ses abonnements (Réseau) : on ne t'invite pas à faire ce que tu as déjà fait */
  listesSeules?: boolean;
  /** Compte connecté : ses abonnés et ses abonnements ne s'ouvrent qu'à sa bande (Réseau), même à ses abonnés */
  bande?: boolean;
};

/**
 * L'encadré d'un profil qu'on ne peut pas voir en entier (compte privé) : il invite à toucher « Suivre » (le bouton est
 * juste au-dessus), ou dit que la demande est partie. Lu d'un seul tenant par VoiceOver.
 */
export function EncadreComptePrive({ prenom, demandeEnvoyee = false, listesSeules = false, bande = false }: Props) {
  const titre = bande ? "Réservé à sa bande" : listesSeules ? "Listes privées" : "Compte privé";
  const texte = bande
    ? `Qui suit ${prenom}, et qui ${prenom} suit : ça reste entre ${prenom} et sa bande.`
    : listesSeules
      ? `Qui suit ${prenom}, et qui ${prenom} suit : ça reste entre ${prenom} et ses abonnés.`
      : `Les lieux, les listes et les abonnés ${eliderDe(prenom)} sont réservés à ses abonnés et à sa bande.`;
  const suite = bande
    ? `Une fois dans la bande ${eliderDe(prenom)}, tout s'ouvre ici.`
    : listesSeules
      ? "Son profil, lui, t'est grand ouvert."
      : demandeEnvoyee
        ? `Ta demande est partie : dès que ${prenom} dit oui, tout s'ouvre ici.`
        : "Touche « Suivre » : ça lui envoie une demande.";

  return (
    <View accessible accessibilityLabel={lierPonctuation(`${titre}. ${texte} ${suite}`)} className="gap-1.5 rounded-carte border-2 border-encre bg-white p-4">
      <Text className="font-titre-gras text-lg text-encre">{`🔒 ${titre}`}</Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>
      <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(suite)}</Text>
    </View>
  );
}
