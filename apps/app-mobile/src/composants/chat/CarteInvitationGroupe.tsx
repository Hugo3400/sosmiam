import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import type { InvitationGroupeChat } from "@sos-miam/commun/types/conversations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Props = { invitation: InvitationGroupeChat };

/**
 * « Rejoindre le groupe ? » : une invitation qui attend ta réponse (compte connecté). Oui : tu entres et tu vois la suite (pas
 * les messages d'avant). Non : en silence, personne n'est prévenu. On ne voit ni les messages ni les noms des membres avant.
 */
export function CarteInvitationGroupe({ invitation }: Props) {
  const router = useRouter();
  const { repondreInvitation } = utiliserConversations();
  const { trouverPote } = utiliserCommunaute();
  const [enCours, setEnCours] = useState(false);
  const [souci, setSouci] = useState(false);
  const qui = invitation.invitePar ? (trouverPote(invitation.invitePar)?.prenom ?? "Un pote") : "Quelqu'un qui a quitté SOS Miam";
  const titre = invitation.titre ?? "un groupe";
  const deja = invitation.membres > 1 ? `${invitation.membres} membres y sont déjà.` : "Tu serais parmi les premiers.";

  async function repondre(rejoint: boolean) {
    vibrerLegerement();
    setEnCours(true);
    const fait = await repondreInvitation(invitation.id, rejoint);
    setEnCours(false);
    setSouci(!fait);
    if (!fait) return AccessibilityInfo.announceForAccessibility("Ça n'a pas marché cette fois. Réessaie dans un instant.");
    if (rejoint) router.push({ pathname: "/potes/discussion/[id]", params: { id: invitation.id } });
    else AccessibilityInfo.announceForAccessibility("C'est noté, en toute discrétion.");
  }

  return (
    <View accessible={false} className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View className="flex-row items-center gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
          {invitation.emoji ?? "💬"}
        </Text>
        <View className="flex-1">
          <Text className="font-texte-gras text-base text-encre">{lierPonctuation(`${qui} t'invite dans « ${titre} »`)}</Text>
          <Text className="font-texte text-sm text-gris">{lierPonctuation(`Rejoindre le groupe ? ${deja}`)}</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Rejoindre ${titre}`}
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(true)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">{enCours ? "Un instant…" : "Je rejoins"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pas pour moi, ${titre}`}
          accessibilityHint="Personne n'est prévenu"
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(false)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">Pas pour moi</Text>
        </Pressable>
      </View>
      {souci ? <Text className="font-texte text-sm text-rouge-texte">{lierPonctuation("Ça n'a pas marché cette fois. Réessaie dans un instant.")}</Text> : null}
    </View>
  );
}
