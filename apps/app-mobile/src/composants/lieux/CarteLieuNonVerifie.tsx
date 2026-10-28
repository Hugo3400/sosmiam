import { Text, View } from "react-native";

import { NOMS_SOURCES_LIEUX_PAR_LANGUE } from "@sos-miam/commun/contenus/sources-lieux";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/textes-fiche-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserInviterLieu } from "~/hooks/utiliser-inviter-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Sur la fiche d'un lieu non vérifié : il n'a pas encore de compte SOS Miam, donc pas de visite validée, de points ni de
 * rescousse ici pour l'instant. Tu le connais ? Invite-le (feuille de partage, lien d'inscription gratuite). Une fiche
 * importée dit d'où viennent ses infos (sa source).
 */
export function CarteLieuNonVerifie({ lieu }: { lieu: Pick<Lieu, "nom" | "source"> }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const nomsSources = utiliserTextes(NOMS_SOURCES_LIEUX_PAR_LANGUE);
  const origine = lieu.source ? T.nonVerifie.source(nomsSources[lieu.source.nom] ?? lieu.source.nom) : T.nonVerifie.ajoute;
  const inviter = utiliserInviterLieu();
  return (
    <View className="gap-3 rounded-carte border-2 border-dashed border-gris/60 bg-carte p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
        {T.nonVerifie.titre}
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(T.nonVerifie.texte(origine))}
      </Text>
      <Bouton libelle={T.inviter} variante="blanc" indice={T.inviterIndice} onPress={() => inviter(lieu)} />
    </View>
  );
}
