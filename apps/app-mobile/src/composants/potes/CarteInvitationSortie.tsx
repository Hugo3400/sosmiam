import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type InvitationSortie } from "~/hooks/utiliser-communaute";

type Props = { invitation: InvitationSortie };

const SOUCI = "Ça n'a pas marché cette fois. Réessaie dans un instant.";

/**
 * « Léa t'invite : Pizza du jeudi » : une sortie qui attend ta réponse (compte connecté). « Carrément ! » : tu entres dans le
 * vote et la discussion, et la sortie s'ouvre. « Pas cette fois » : en silence, personne n'est prévenu. Avant de répondre, on
 * ne voit ni les lieux proposés, ni les votes, ni la discussion.
 */
export function CarteInvitationSortie({ invitation }: Props) {
  const router = useRouter();
  const { repondreInvitationSortie, trouverPote } = utiliserCommunaute();
  const [enCours, setEnCours] = useState(false);
  const [souci, setSouci] = useState(false);
  const invitePar = invitation.invitePar ?? invitation.organisateur;
  const qui = invitePar ? (trouverPote(invitePar)?.prenom ?? "Un pote") : "Quelqu'un qui a quitté SOS Miam";
  const quand = `${ecrireJourLong(invitation.quand)} à ${ecrireHeure(invitation.quand)}`;
  const deja = invitation.participants > 1 ? `${invitation.participants} ont déjà dit oui.` : "Personne n'a encore répondu : à toi l'honneur !";

  async function repondre(vient: boolean) {
    vibrerLegerement();
    setEnCours(true);
    const fait = await repondreInvitationSortie(invitation.id, vient);
    setEnCours(false);
    setSouci(!fait);
    if (!fait) return AccessibilityInfo.announceForAccessibility(SOUCI);
    if (vient) router.push({ pathname: "/potes/sortie/[id]", params: { id: invitation.id } });
    else AccessibilityInfo.announceForAccessibility("C'est noté, en toute discrétion.");
  }

  return (
    <View accessible={false} className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View className="flex-row items-center gap-3">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-12 w-12 items-center justify-center rounded-2xl border-2 border-encre bg-white"
        >
          <Text allowFontScaling={false} className="text-2xl">
            {invitation.emoji}
          </Text>
        </View>
        <View accessible className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{lierPonctuation(`${qui} t'invite : ${invitation.titre}`)}</Text>
          <Text className="font-texte-moyen text-[13px] text-encre">{quand}</Text>
          <Text className="font-texte text-[13px] text-gris">{lierPonctuation(deja)}</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Carrément, je viens à ${invitation.titre}`}
          accessibilityHint="Ouvre la sortie : tu pourras voter et discuter"
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(true)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">{enCours ? "Un instant…" : "Carrément !"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pas cette fois, ${invitation.titre}`}
          accessibilityHint="Personne n'est prévenu"
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(false)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">Pas cette fois</Text>
        </Pressable>
      </View>
      <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation("Dis oui pour voter et discuter avec la bande.")}</Text>
      {souci ? <Text className="font-texte text-sm text-rouge-texte">{lierPonctuation(SOUCI)}</Text> : null}
    </View>
  );
}
