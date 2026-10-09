import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserInviterLieu } from "~/hooks/utiliser-inviter-lieu";

/**
 * Sur la fiche d'un lieu non vérifié : il n'a pas encore de compte SOS Miam, donc pas de visite validée, de points ni de
 * rescousse ici pour l'instant. Tu le connais ? Invite-le (feuille de partage, lien d'inscription gratuite).
 */
export function CarteLieuNonVerifie({ lieu }: { lieu: Pick<Lieu, "nom"> }) {
  const inviter = utiliserInviterLieu();
  return (
    <View className="gap-3 rounded-carte border-2 border-dashed border-gris/60 bg-white p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
        Ce lieu n'a pas encore de compte SOS Miam
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(
          "Il a été ajouté par l'équipe ou par un ambassadeur. Tu peux le garder, t'y rendre et donner ton avis, mais pas encore valider ta visite ni lui donner une rescousse : ça s'ouvre dès qu'il nous rejoint.",
        )}
      </Text>
      <Bouton libelle="Inviter ce lieu" variante="blanc" indice="Partage-lui le lien d'inscription, c'est gratuit" onPress={() => inviter(lieu)} />
    </View>
  );
}
