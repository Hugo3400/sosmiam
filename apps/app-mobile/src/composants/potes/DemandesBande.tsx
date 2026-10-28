import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_BANDE_ACTIVITE_PAR_LANGUE } from "~/contenus/textes-bande-activite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * « Ils veulent rejoindre ta bande » : les demandes reçues par pseudo, à accepter (vous voilà potes) ou à laisser de côté (sans
 * prévenir la personne). Rien quand il n'y en a pas.
 */
export function DemandesBande() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE).demandes;
  const { demandesRecues, accepterDemandeBande, retirerDemandeBande } = utiliserCommunaute();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [souci, setSouci] = useState<string | null>(null);
  if (demandesRecues.length === 0) return null;

  async function repondre(pote: Pote, accepte: boolean) {
    vibrerLegerement();
    setEnCours(pote.id);
    const erreur = accepte ? await accepterDemandeBande(pote.id) : await retirerDemandeBande(pote.id);
    setEnCours(null);
    const message = erreur ? T.souci : accepte ? T.rejoint(pote.prenom) : T.ignoree(pote.prenom);
    setSouci(erreur ? message : null);
    AccessibilityInfo.announceForAccessibility(message);
  }

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre text-xl text-encre">
        {T.titre}
      </Text>
      {demandesRecues.map((pote) => (
        <View key={pote.id} className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pote.prenom}, @${pote.pseudo}`}
            accessibilityHint={T.indiceProfil}
            onPress={() => router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } })}
            className="min-h-12 flex-row items-center gap-3 active:opacity-70"
          >
            <RondPote pote={pote} taille={44} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                {pote.prenom}
              </Text>
              <Text numberOfLines={1} className="font-texte text-sm text-gris">
                @{pote.pseudo}
              </Text>
            </View>
          </Pressable>
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.accepterLu(pote.prenom)}
              accessibilityState={{ disabled: enCours === pote.id }}
              disabled={enCours === pote.id}
              onPress={() => void repondre(pote, true)}
              className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-nuit">{enCours === pote.id ? T.unInstant : T.accepter}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.plusTardLu(pote.prenom)}
              accessibilityHint={T.indicePlusTard}
              accessibilityState={{ disabled: enCours === pote.id }}
              disabled={enCours === pote.id}
              onPress={() => void repondre(pote, false)}
              className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-encre">{T.plusTard}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {souci ? <Text className="font-texte text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text> : null}
    </View>
  );
}
