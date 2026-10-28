import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_VOTE_SORTIE_PAR_LANGUE } from "~/contenus/textes-vote-sortie";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: Lieu;
  /** Distance affichée (depuis ta ville) ; null si on ne la connaît pas : sa ville à la place */
  km: number | null;
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

/** Un lieu proposé dans une sortie : vignette, nom, distance, qui l'a proposé, les votes et leurs avatars, et le bouton pour voter. */
export function PropositionVote({ lieu, km, image, proposePar, votes, votants, aVote, termine, gagnant, onVoter, onOuvrir }: Props) {
  const couleurs = utiliserCouleurs();
  const monId = utiliserMonId();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_VOTE_SORTIE_PAR_LANGUE).proposition;
  const prenomDe = (pote: Pote) => (pote.id === monId ? T.toi : pote.prenom);
  const distance = km === null ? null : formaterDistanceLangue(km, langue);
  const nombreVotes = votes === 0 ? T.pasDeVote : T.votes(votes);
  const montres = votants.slice(0, AVATARS_MAX);
  const lu = [
    termine && gagnant ? T.retenu : null,
    `${lieu.nom}, ${lieu.info}, ${distance ? T.aDistance(distance) : lieu.ville}`,
    proposePar ? T.proposePar(prenomDe(proposePar)) : null,
    votants.length > 0 ? T.votantsLu(nombreVotes, votants.map(prenomDe).join(", ")) : nombreVotes,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View className={`flex-row items-center gap-2 rounded-carte border-2 p-2.5 ${gagnant && termine ? "border-encre bg-jaune-clair" : "border-encre bg-carte"}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lu}
        accessibilityHint={T.ficheIndice}
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
            {lieu.info} · {distance ?? lieu.ville}
          </Text>
          {proposePar ? (
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              {T.proposeParDebut}
              <Text className="font-texte-semi text-encre">{prenomDe(proposePar)}</Text>
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
          accessibilityLabel={aVote ? T.retirerVote(lieu.nom) : T.voterPour(lieu.nom)}
          onPress={() => {
            vibrerLegerement();
            onVoter();
          }}
          className={`min-h-11 min-w-[84px] flex-row items-center justify-center gap-1 rounded-full border-2 border-encre px-3 active:opacity-80 ${aVote ? "bg-nuit" : "bg-jaune"}`}
        >
          {aVote ? <Ionicons name="checkmark" size={16} color={couleurs.jaune} /> : null}
          <Text className={`font-texte-gras text-sm ${aVote ? "text-jaune" : "text-nuit"}`}>{aVote ? T.vote : T.voter}</Text>
        </Pressable>
      )}
    </View>
  );
}
