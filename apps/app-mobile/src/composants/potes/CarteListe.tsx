import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { ListePartagee } from "@sos-miam/commun/types/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  liste: ListePartagee;
  /** « toi », ou le prénom de la personne qui l'a créée */
  auteur: string;
  /** Les lieux de la liste que tu peux voir (sans les bars sous 18 ans), avec leur image */
  lieux: { lieu: Lieu; image: ImageSourcePropType | null }[];
  onOuvrir: (id: string) => void;
  /** Le menu « ⋯ » (liste d'un pote : son profil, signaler la liste, bloquer) ; sans lui, une simple flèche */
  onMenu?: () => void;
};

const TAILLE_VIGNETTE = 36;
const MAX_VIGNETTES = 3;

/** Une liste partagée : emoji, titre, nombre de lieux, qui l'a faite, et ses premiers lieux en petit. Lue d'un seul bloc, avec son « ⋯ » à côté s'il y en a un. */
export function CarteListe({ liste, auteur, lieux, onOuvrir, onMenu }: Props) {
  const nombre = lieux.length;
  const abonnes = liste.abonnes.length;
  const lieuxTexte = `${nombre} lieu${nombre > 1 ? "x" : ""}`;
  const abonnesTexte = abonnes > 0 ? `${abonnes} abonné${abonnes > 1 ? "s" : ""}` : null;
  const lu = [liste.titre, lieuxTexte, auteur === "toi" ? "Créée par toi" : `Par ${auteur}`, abonnesTexte].filter(Boolean).join(", ");

  const carte = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint="Ouvre la liste"
      onPress={() => {
        vibrerLegerement();
        onOuvrir(liste.id);
      }}
      className={`min-h-20 flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white p-3.5 active:opacity-80 ${onMenu ? "pr-14" : ""}`}
    >
      <View style={{ width: 52, height: 52 }} className="items-center justify-center rounded-2xl border-2 border-encre bg-jaune-clair">
        <Text allowFontScaling={false} className="text-[26px]">
          {liste.emoji}
        </Text>
      </View>

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="font-texte-gras text-base text-encre">
          {liste.titre}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {lieuxTexte} · {auteur === "toi" ? "par toi" : `par ${auteur}`}
          {abonnesTexte ? ` · ${abonnesTexte}` : ""}
        </Text>
      </View>

      {nombre > 0 ? (
        <View className="flex-row pl-3">
          {lieux.slice(0, MAX_VIGNETTES).map(({ lieu, image }) => (
            <View key={lieu.id} className="-ml-3 rounded-[12px] border-2 border-white">
              <VignetteLieu lieu={lieu} image={image} hauteur={TAILLE_VIGNETTE} arrondi={10} />
            </View>
          ))}
        </View>
      ) : null}
      {onMenu ? null : <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />}
    </Pressable>
  );
  if (!onMenu) return carte;

  return (
    // Le « ⋯ » est posé à côté de la carte (pas dedans) : le lecteur d'écran les lit l'un après l'autre
    <View className="relative">
      {carte}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Plus d'options sur la liste ${liste.titre}`}
        accessibilityHint={`Voir le profil de ${auteur}, signaler la liste, ou bloquer cette personne`}
        onPress={() => {
          vibrerLegerement();
          onMenu();
        }}
        className="absolute bottom-0 right-1 top-0 w-12 items-center justify-center active:opacity-60"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
