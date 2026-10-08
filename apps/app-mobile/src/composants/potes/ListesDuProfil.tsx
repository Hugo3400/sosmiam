import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Identifiant de la personne (« moi » pour toi) */
  auteurId: string;
  prenom: string;
  /** Ton propre profil : le texte te parle directement */
  estMoi: boolean;
};

/**
 * Les listes partagées d'une personne, sur son profil : emoji, titre et nombre de lieux (seulement ceux que ton âge permet :
 * pas de bar avant 18 ans). Toucher une liste l'ouvre. Affiché seulement quand on peut voir son profil en entier.
 */
export function ListesDuProfil({ auteurId, prenom, estMoi }: Props) {
  const router = useRouter();
  const { listes } = utiliserCommunaute();
  const { profil } = utiliserProfil();
  const permis = new Set(filtrerLieuxSelonAge(lieuxExemples, profil ? calculerAge(profil.dateNaissance) : null).map((l) => l.id));
  const siennes = listes.filter((l) => l.auteur === auteurId);

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" accessibilityLabel={`Listes partagées, ${siennes.length}`} className="font-titre-gras text-xl text-encre">
        🗂️ Listes partagées ({siennes.length})
      </Text>
      {siennes.length === 0 ? (
        <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
          <Text className="text-center font-texte text-sm leading-5 text-gris">
            {lierPonctuation(estMoi ? "Pas encore de liste : crée-en une dans Potes › Listes." : `${prenom} n'a pas encore de liste partagée.`)}
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
          {siennes.map((liste, i) => {
            const nombre = liste.lieux.filter((id) => permis.has(id)).length;
            const lieux = `${nombre} lieu${nombre > 1 ? "x" : ""}`;
            return (
              <Pressable
                key={liste.id}
                accessibilityRole="button"
                accessibilityLabel={`${liste.titre}, ${lieux}`}
                accessibilityHint="Ouvre la liste"
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
