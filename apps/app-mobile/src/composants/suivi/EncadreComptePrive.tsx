import { Text, View } from "react-native";

import { eliderDe } from "~/fonctions/texte/elider-de";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Son prénom, dans le texte */
  prenom: string;
  /** Vrai si la règle te permet de lui demander à la suivre (le bouton « Suivre » est affiché juste au-dessus) */
  peutDemander: boolean;
  /** Ta demande est partie et attend sa réponse (le bouton, au-dessus, affiche « Demandé ») */
  demandeEnvoyee?: boolean;
  /** Son profil t'est ouvert, mais pas ses abonnés ni ses abonnements (Réseau) : on ne t'invite pas à faire ce que tu as déjà fait */
  listesSeules?: boolean;
};

/**
 * L'encadré d'un profil qu'on ne peut pas voir en entier (compte privé, ou réservé à sa bande). Le même texte pour les deux,
 * pour que rien ne révèle l'âge de la personne. Lu d'un seul tenant par VoiceOver.
 * Quand la règle ne permet pas de demander (entre un adulte et un 15-17 ans), une phrase neutre : jamais d'invitation à se
 * rencontrer ou à s'ajouter en vrai (lien, QR code), qui pousserait un adulte et un ado inconnus à se voir.
 */
export function EncadreComptePrive({ prenom, peutDemander, demandeEnvoyee = false, listesSeules = false }: Props) {
  const titre = listesSeules ? "Listes privées" : "Compte privé";
  const texte = listesSeules
    ? `Qui suit ${prenom}, et qui ${prenom} suit : ça reste entre ${prenom} et ses abonnés.`
    : `Les lieux, les listes et les abonnés ${eliderDe(prenom)} sont réservés à ses abonnés et à sa bande.`;
  const suite = listesSeules
    ? "Son profil, lui, t'est grand ouvert."
    : demandeEnvoyee
      ? `Ta demande est partie : dès que ${prenom} dit oui, tout s'ouvre ici.`
      : peutDemander
        ? "Touche « Suivre » : ça lui envoie une demande."
        : "Ça reste entre eux : plein d'autres bons plans t'attendent ailleurs !";

  return (
    <View accessible accessibilityLabel={lierPonctuation(`${titre}. ${texte} ${suite}`)} className="gap-1.5 rounded-carte border-2 border-encre bg-white p-4">
      <Text className="font-titre-gras text-lg text-encre">{`🔒 ${titre}`}</Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>
      <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(suite)}</Text>
    </View>
  );
}
