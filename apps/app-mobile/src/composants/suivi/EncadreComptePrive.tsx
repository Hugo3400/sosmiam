import { Text, View } from "react-native";

import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_SUIVI_PAR_LANGUE).comptePrive;
  const titre = bande ? T.titreBande : listesSeules ? T.titreListes : T.titre;
  const texte = bande ? T.texteBande(prenom) : listesSeules ? T.texteListes(prenom) : T.texte(prenom);
  const suite = bande ? T.suiteBande(prenom) : listesSeules ? T.suiteListes : demandeEnvoyee ? T.suiteDemande(prenom) : T.suiteSuivre;

  return (
    <View accessible accessibilityLabel={lierPonctuation(`${titre}. ${texte} ${suite}`)} className="gap-1.5 rounded-carte border-2 border-encre bg-carte p-4">
      <Text className="font-titre-gras text-lg text-encre">{`🔒 ${titre}`}</Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>
      <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(suite)}</Text>
    </View>
  );
}
