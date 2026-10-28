import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import type { ListePartagee } from "@sos-miam/commun/types/potes";
import { TEXTES_LISTES_PARTAGEES_PAR_LANGUE } from "~/contenus/textes-listes-partagees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  liste: ListePartagee;
  /** Après « Carrément ! », ouvrir la liste (faux quand on y est déjà) */
  ouvrirApresOui?: boolean;
};

/**
 * « Léa t'invite à remplir « Brunchs du dimanche » » : une invitation à ajouter tes pépites dans la liste d'un pote (compte
 * connecté). « Carrément ! » : tu peux y ajouter des lieux. « Pas pour moi » : en silence, personne n'est prévenu.
 */
export function CarteInvitationListe({ liste, ouvrirApresOui = true }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE).invitation;
  const { repondreCoAuteur, trouverPote } = utiliserCommunaute();
  const [enCours, setEnCours] = useState(false);
  const [souci, setSouci] = useState(false);
  const qui = trouverPote(liste.auteur)?.prenom ?? T.unPote;

  async function repondre(accepte: boolean) {
    vibrerLegerement();
    setEnCours(true);
    const fait = await repondreCoAuteur(liste.id, accepte);
    setEnCours(false);
    setSouci(!fait);
    if (!fait) return AccessibilityInfo.announceForAccessibility(T.souci);
    if (accepte && ouvrirApresOui) router.push({ pathname: "/potes/liste/[id]", params: { id: liste.id } });
    else AccessibilityInfo.announceForAccessibility(accepte ? T.acceptee(liste.titre, qui) : T.noteDiscret);
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
            {liste.emoji}
          </Text>
        </View>
        <View accessible className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{lierPonctuation(T.invite(qui, liste.titre))}</Text>
          <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.bienvenues)}</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.ouiLu(liste.titre)}
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
          accessibilityLabel={T.nonLu(liste.titre)}
          accessibilityHint={T.indiceNon}
          accessibilityState={{ disabled: enCours }}
          disabled={enCours}
          onPress={() => void repondre(false)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">{T.non}</Text>
        </Pressable>
      </View>
      {souci ? <Text className="font-texte text-sm text-rouge-texte">{lierPonctuation(T.souci)}</Text> : null}
    </View>
  );
}
