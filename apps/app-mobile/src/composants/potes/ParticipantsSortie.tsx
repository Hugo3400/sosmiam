import { Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { listerPrenoms } from "~/fonctions/texte/lister-prenoms";

type Props = {
  /** Participants à montrer (toi compris), l'organisateur en premier de préférence */
  participants: Pote[];
  /** Qui organise (null si on ne le connaît plus) */
  organisateur: Pote | null;
  /** Avatars montrés avant « +3 » */
  max?: number;
};

const TAILLE = 30;

/** Les têtes de la sortie, en rangée qui se chevauche, avec qui organise et combien vous êtes. Lu en une phrase. */
export function ParticipantsSortie({ participants, organisateur, max = 6 }: Props) {
  const montres = participants.slice(0, max);
  const reste = participants.length - montres.length;
  const qui = organisateur ? (organisateur.id === ID_MOI ? "toi" : organisateur.prenom) : null;
  const nombre = `${participants.length} participant${participants.length > 1 ? "s" : ""}`;
  const lu = `${nombre} : ${listerPrenoms(participants.map((p) => (p.id === ID_MOI ? "toi" : p.prenom)))}.${qui ? ` Organisée par ${qui}.` : ""}`;

  return (
    <View accessible accessibilityLabel={lu} className="flex-row items-center gap-3">
      <View className="flex-row" style={{ paddingLeft: 8 }}>
        {montres.map((p) => (
          <View key={p.id} style={{ marginLeft: -8 }}>
            <RondPote pote={p} taille={TAILLE} />
          </View>
        ))}
        {reste > 0 ? (
          <View
            style={{ width: TAILLE, height: TAILLE, borderRadius: TAILLE / 2, marginLeft: -8 }}
            className="items-center justify-center border-2 border-encre bg-white"
          >
            <Text allowFontScaling={false} className="font-texte-gras text-[11px] text-encre">
              +{reste}
            </Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} className="flex-1 font-texte text-[13px] leading-[18px] text-gris">
        {nombre}
        {qui ? (
          <>
            {" · organisée par "}
            <Text className="font-texte-semi text-encre">{qui}</Text>
          </>
        ) : null}
      </Text>
    </View>
  );
}
