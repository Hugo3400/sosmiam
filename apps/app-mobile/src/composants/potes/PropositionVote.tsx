import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { RondPote } from "~/composants/potes/RondPote";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  lieu: Lieu;
  /** Distance affichée (depuis ta ville) */
  km: number;
  /** Image du lieu ; sans image, son dégradé et son emoji */
  image: ImageSourcePropType | null;
  /** Qui l'a proposé (null si on ne le connaît plus) */
  proposePar: Pote | null;
  /** Nombre de votes, toutes personnes comprises */
  votes: number;
  /** Qui a voté, pour les avatars (sans les personnes bloquées) */
  votants: Pote[];
  aVote: boolean;
  /** Vote terminé : plus de bouton, le lieu retenu est mis en avant */
  termine: boolean;
  gagnant: boolean;
  onVoter: () => void;
  onOuvrir: () => void;
};

const AVATARS_MAX = 5;

const prenomDe = (pote: Pote) => (pote.id === ID_MOI ? "toi" : pote.prenom);

/** Un lieu proposé dans une sortie : vignette, nom, distance, qui l'a proposé, les votes et leurs avatars, et le bouton pour voter. */
export function PropositionVote({ lieu, km, image, proposePar, votes, votants, aVote, termine, gagnant, onVoter, onOuvrir }: Props) {
  const distance = formaterDistance(km);
  const nombreVotes = votes === 0 ? "Pas encore de vote" : `${votes} vote${votes > 1 ? "s" : ""}`;
  const montres = votants.slice(0, AVATARS_MAX);
  const lu = [
    termine && gagnant ? "Lieu retenu" : null,
    `${lieu.nom}, ${lieu.info}, à ${distance}`,
    proposePar ? `Proposé par ${prenomDe(proposePar)}` : null,
    votants.length > 0 ? `${nombreVotes} : ${votants.map(prenomDe).join(", ")}` : nombreVotes,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View className={`flex-row items-center gap-2 rounded-carte border-2 p-2.5 ${gagnant && termine ? "border-encre bg-jaune-clair" : "border-encre bg-white"}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lu}
        accessibilityHint="Ouvre la fiche du lieu"
        onPress={() => {
          vibrerLegerement();
          onOuvrir();
        }}
        className="flex-1 flex-row items-center gap-3 active:opacity-70"
      >
        <VignetteLieu lieu={lieu} image={image} hauteur={64} />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
            {termine && gagnant ? "🏆 " : ""}
            {lieu.nom}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            {lieu.info} · {distance}
          </Text>
          {proposePar ? (
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              Proposé par <Text className="font-texte-semi text-encre">{prenomDe(proposePar)}</Text>
            </Text>
          ) : null}
          <View className="mt-1 flex-row items-center gap-2">
            {montres.length > 0 ? (
              <View className="flex-row" style={{ paddingLeft: 6 }}>
                {montres.map((p) => (
                  <View key={p.id} style={{ marginLeft: -6 }}>
                    <RondPote pote={p} taille={22} />
                  </View>
                ))}
              </View>
            ) : null}
            <Text className={`font-texte-semi text-[13px] ${votes > 0 ? "text-encre" : "text-gris"}`}>{nombreVotes}</Text>
          </View>
        </View>
      </Pressable>

      {termine ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={aVote ? `Retirer ton vote pour ${lieu.nom}` : `Voter pour ${lieu.nom}`}
          onPress={() => {
            vibrerLegerement();
            onVoter();
          }}
          className={`min-h-11 min-w-[84px] flex-row items-center justify-center gap-1 rounded-full border-2 border-encre px-3 active:opacity-80 ${aVote ? "bg-encre" : "bg-jaune"}`}
        >
          {aVote ? <Ionicons name="checkmark" size={16} color={couleurs.jaune} /> : null}
          <Text className={`font-texte-gras text-sm ${aVote ? "text-jaune" : "text-encre"}`}>{aVote ? "Voté" : "Voter"}</Text>
        </Pressable>
      )}
    </View>
  );
}
