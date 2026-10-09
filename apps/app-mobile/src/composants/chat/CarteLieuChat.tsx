import { useRouter } from "expo-router";
import { Pressable, Text, useWindowDimensions, View, type PressableProps } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { lieuEvoqueAlcool } from "@sos-miam/commun/fonctions/prevention/lieu-evoque-alcool";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";

type Props = {
  conversationId: string;
  /** Le lieu partagé */
  lieuId: number | undefined;
  /** Qui l'a envoyé et quand, lu avant le lieu : « Léa, 14h32 », « Toi, 14h32 » */
  contexte: string;
  /** Appui long : le menu du message (réactions, signaler) */
  onAppuiLong: () => void;
  /** Actions du lecteur d'écran (cœur, options), posées sur la carte */
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

const parId = new Map(lieuxExemples.map((l) => [l.id, l]));

/**
 * Un lieu partagé dans le chat : photo ou emoji, nom, ce que c'est, ville et SOS du moment. La toucher ouvre sa fiche ;
 * « On y va ? » prépare une sortie à ce lieu avec les potes de la conversation (pas de bar quand un mineur en fait partie).
 */
export function CarteLieuChat({ conversationId, lieuId, contexte, onAppuiLong, actionsLecteur }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { moiMineur, lieuPermisDansSortie } = utiliserCommunaute();
  const { trouverConversation } = utiliserConversations();
  const largeur = Math.min(260, Math.round(width * 0.66));

  const trouve = lieuId === undefined ? null : (parId.get(lieuId) ?? null);
  // Par prudence : un bar n'existe pas pour toi avant 18 ans (le chat le retire déjà)
  const lieu = trouve && !(moiMineur && trouve.type === "bar") ? trouve : null;

  if (!lieu) {
    return (
      <Pressable
        accessibilityLabel={`${contexte} : un lieu qui n'est plus disponible`}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        style={{ width: largeur }}
        className="flex-row items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-3"
      >
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
          🗺️
        </Text>
        <Text className="flex-1 font-texte text-sm leading-5 text-gris">{lierPonctuation("Ce lieu s'est perdu en route : il n'est plus dans l'app.")}</Text>
      </Pressable>
    );
  }

  const conversation = trouverConversation(conversationId);
  const participants = conversation?.participants ?? [ID_MOI];
  const permis = lieuPermisDansSortie(lieu.id, participants);
  const sos = lieu.sos && estSosEnCours(lieu) ? `${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}` : null;
  const lu = [`${contexte} : un lieu partagé`, `${lieu.nom}, ${lieu.info}, ${lieu.quartier}, ${lieu.ville}`, sos ? `SOS : ${sos}` : lieu.alerte].filter(Boolean).join(". ");

  function partir() {
    if (!lieu) return;
    const invites = participants.filter((id) => id !== ID_MOI).join(",");
    router.push({ pathname: "/potes/nouvelle-sortie", params: { lieu: String(lieu.id), invites } });
  }

  return (
    <View style={{ width: largeur }} className="overflow-hidden rounded-carte border-2 border-encre bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lu}
        accessibilityHint="Ouvre la fiche du lieu"
        onPress={() => {
          vibrerLegerement();
          router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });
        }}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        className="active:opacity-80"
      >
        <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, publicationsExemples)} hauteur={112} largeur="100%" arrondi={0} />
        <View className="gap-0.5 px-3.5 pb-1 pt-2.5">
          <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
            {lieu.nom}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            {lieu.info} · {lieu.ville}
          </Text>
          {sos ? (
            <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full border border-encre bg-jaune px-2 py-0.5 font-texte-gras text-xs text-encre">
              🛟 SOS · {sos}
            </Text>
          ) : lieu.alerte ? (
            <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full bg-rose-alerte px-2 py-0.5 font-texte-gras text-xs text-rouge-texte">
              🔥 {lieu.alerte}
            </Text>
          ) : null}
          {lieuEvoqueAlcool(lieu) ? (
            <View className="mt-1">
              <MentionPrevention variante="courte" />
            </View>
          ) : null}
        </View>
      </Pressable>
      {permis ? (
        <View className="px-3.5 pb-3.5 pt-2">
          <Bouton petit libelle={lierPonctuation("On y va ?")} onPress={partir} indice="Prépare une sortie à ce lieu avec les potes de la conversation" />
        </View>
      ) : (
        <View className="h-2.5" />
      )}
    </View>
  );
}
