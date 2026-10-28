import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { TEXTES_ONGLET_LISTES_PAR_LANGUE } from "~/contenus/textes-onglet-listes";
import { compterLieuxListe } from "~/fonctions/communaute/compter-lieux-liste";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Identifiant de la personne (« moi » pour toi) */
  auteurId: string;
  prenom: string;
  /** Ton propre profil : le texte te parle directement */
  estMoi: boolean;
};

/**
 * Les listes partagées d'une personne, sur son profil : emoji, titre et nombre de lieux (ceux encore dans l'app).
 * Toucher une liste l'ouvre. Affiché seulement quand on peut voir son profil en entier.
 */
export function ListesDuProfil({ auteurId, prenom, estMoi }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ONGLET_LISTES_PAR_LANGUE).profil;
  const router = useRouter();
  const { listes } = utiliserCommunaute();
  const { lieux: tousLesLieux } = utiliserLieux();
  const connus = new Set(tousLesLieux.map((l) => l.id));
  const siennes = listes.filter((l) => l.auteur === auteurId);

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" accessibilityLabel={T.titreLu(siennes.length)} className="font-titre-gras text-xl text-encre">
        {T.titre(siennes.length)}
      </Text>
      {siennes.length === 0 ? (
        <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
          <Text className="text-center font-texte text-sm leading-5 text-gris">
            {lierPonctuation(estMoi ? T.videMoi : T.videAutre(prenom))}
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
          {siennes.map((liste, i) => {
            // Compte connecté, lue en résumé : le nombre du serveur ; sinon, ses lieux encore dans l'app
            const nombre = liste.serveur && !liste.serveur.complete ? compterLieuxListe(liste) : liste.lieux.filter((id) => connus.has(id)).length;
            const lieux = T.lieux(nombre);
            return (
              <Pressable
                key={liste.id}
                accessibilityRole="button"
                accessibilityLabel={`${liste.titre}, ${lieux}`}
                accessibilityHint={T.ouvrirIndice}
                onPress={() => {
                  vibrerLegerement();
                  router.push({ pathname: "/potes/liste/[id]", params: { id: liste.id } });
                }}
                className={`min-h-14 flex-row items-center gap-3 px-3.5 py-2.5 active:opacity-70 ${i < siennes.length - 1 ? "border-b border-ligne" : ""}`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl border-2 border-encre bg-jaune-clair">
                  <Text allowFontScaling={false} className="text-xl">
                    {liste.emoji}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text numberOfLines={2} className="font-texte-gras text-base text-encre">
                    {liste.titre}
                  </Text>
                  <Text className="font-texte text-[13px] text-gris">{lieux}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
