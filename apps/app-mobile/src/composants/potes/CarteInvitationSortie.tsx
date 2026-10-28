import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { TEXTES_CARTES_SORTIES_PAR_LANGUE } from "~/contenus/textes-cartes-sorties";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type InvitationSortie } from "~/hooks/utiliser-communaute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { invitation: InvitationSortie };

/**
 * « Léa t'invite : Pizza du jeudi » : une sortie qui attend ta réponse (compte connecté). « Carrément ! » : tu entres dans le
 * vote et la discussion, et la sortie s'ouvre. « Pas cette fois » : en silence, personne n'est prévenu. Avant de répondre, on
 * ne voit ni les lieux proposés, ni les votes, ni la discussion.
 */
export function CarteInvitationSortie({ invitation }: Props) {
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CARTES_SORTIES_PAR_LANGUE).invitation;
  const { repondreInvitationSortie, trouverPote } = utiliserCommunaute();
  const [enCours, setEnCours] = useState(false);
  const [souci, setSouci] = useState(false);
  const invitePar = invitation.invitePar ?? invitation.organisateur;
  const qui = invitePar ? (trouverPote(invitePar)?.prenom ?? T.unPote) : T.quelquUnParti;
  const quand = T.quand(ecrireJourLongLangue(invitation.quand, langue), ecrireHeureLangue(invitation.quand, langue));
  const deja = invitation.participants > 1 ? T.dejaOui(invitation.participants) : T.personne;

  async function repondre(vient: boolean) {
    vibrerLegerement();
    setEnCours(true);
    const fait = await repondreInvitationSortie(invitation.id, vient);
    setEnCours(false);
    setSouci(!fait);
    if (!fait) return AccessibilityInfo.announceForAccessibility(T.souci);
    if (vient) router.push({ pathname: "/potes/sortie/[id]", params: { id: invitation.id } });
    else AccessibilityInfo.announceForAccessibility(T.noteDiscret);
  }

  return (
    <View accessible={false} className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View className="flex-row items-center gap-3">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-12 w-12 items-center justify-center rounded-2xl border-2 border-encre bg-carte"
        >
          <Text allowFontScaling={false} className="text-2xl">
            {invitation.emoji}
          </Text>
        </View>
        <View accessible className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{lierPonctuation(T.invite(qui, invitation.titre))}</Text>
          <Text className="font-texte-moyen text-[13px] text-encre">{quand}</Text>
          <Text className="font-texte text-[13px] text-gris">{lierPonctuation(deja)}</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.ouiLu(invitation.titre)}
          accessibilityHint={T.indiceOui}
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(true)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-nuit">{enCours ? T.unInstant : T.oui}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.nonLu(invitation.titre)}
          accessibilityHint={T.indiceNon}
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(false)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">{T.non}</Text>
        </Pressable>
      </View>
      <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.aide)}</Text>
      {souci ? <Text className="font-texte text-sm text-rouge-texte">{lierPonctuation(T.souci)}</Text> : null}
    </View>
  );
}
