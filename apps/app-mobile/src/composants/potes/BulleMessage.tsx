import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  texte: string;
  /** Qui l'a écrit (null si on ne le connaît plus) */
  auteur: Pote | null;
  deMoi: boolean;
  /** Heure, déjà écrite : « 14h32 » */
  heure: string;
  /** Premier message d'une série du même auteur : son avatar et son prénom au-dessus */
  debutSerie: boolean;
  /** Menu du message (signaler, bloquer), par appui long ou par « ⋯ » ; absent pour tes messages */
  onOptions?: () => void;
};

const TAILLE_AVATAR = 32;

/** Un message de la discussion d'une sortie : les tiens à droite en jaune, ceux des potes à gauche avec leur avatar et leur prénom. */
export function BulleMessage({ texte, auteur, deMoi, heure, debutSerie, onOptions }: Props) {
  if (deMoi) {
    return (
      <View accessible accessibilityLabel={`Toi, ${heure} : ${texte}`} className={`max-w-[85%] items-end self-end ${debutSerie ? "mt-3" : "mt-1"}`}>
        <View className="rounded-2xl rounded-br-md border-2 border-encre bg-jaune px-3.5 py-2.5">
          <Text className="font-texte text-base leading-[22px] text-encre">{lierPonctuation(texte)}</Text>
        </View>
        <Text className="mt-0.5 font-texte text-[11px] text-gris">{heure}</Text>
      </View>
    );
  }

  const prenom = auteur?.prenom ?? "Quelqu'un";
  return (
    <View className={`max-w-[92%] flex-row items-start gap-1.5 self-start ${debutSerie ? "mt-3" : "mt-1"}`}>
      <View style={{ width: TAILLE_AVATAR }} className={debutSerie ? "pt-5" : ""}>
        {debutSerie && auteur ? <RondPote pote={auteur} taille={TAILLE_AVATAR} /> : null}
      </View>
      <Pressable
        accessible
        accessibilityLabel={`${prenom}, ${heure} : ${texte}`}
        onLongPress={
          onOptions
            ? () => {
                vibrerLegerement();
                onOptions();
              }
            : undefined
        }
        delayLongPress={350}
        className="shrink active:opacity-80"
      >
        {debutSerie ? (
          <Text numberOfLines={1} className="mb-0.5 ml-1 font-texte-semi text-[13px] text-gris">
            {prenom}
          </Text>
        ) : null}
        <View className="rounded-2xl rounded-tl-md border-2 border-encre bg-white px-3.5 py-2.5">
          <Text className="font-texte text-base leading-[22px] text-encre">{lierPonctuation(texte)}</Text>
        </View>
        <Text className="ml-1 mt-0.5 font-texte text-[11px] text-gris">{heure}</Text>
      </Pressable>
      {onOptions ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options du message de ${prenom}`}
          accessibilityHint="Signaler ce message ou bloquer cette personne"
          hitSlop={{ left: 4, right: 4 }}
          onPress={() => {
            vibrerLegerement();
            onOptions();
          }}
          className={`h-11 w-9 items-center justify-center active:opacity-60 ${debutSerie ? "mt-5" : ""}`}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={couleurs.gris} />
        </Pressable>
      ) : null}
    </View>
  );
}
