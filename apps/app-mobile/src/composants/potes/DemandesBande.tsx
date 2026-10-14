import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

/**
 * « Ils veulent rejoindre ta bande » : les demandes reçues par pseudo, à accepter (vous voilà potes) ou à laisser de côté (sans
 * prévenir la personne). Rien quand il n'y en a pas (et jamais en démo, où l'on ajoute sans demande).
 */
export function DemandesBande() {
  const router = useRouter();
  const { demandesRecues, accepterDemandeBande, retirerDemandeBande } = utiliserCommunaute();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [souci, setSouci] = useState<string | null>(null);
  if (demandesRecues.length === 0) return null;

  async function repondre(pote: Pote, accepte: boolean) {
    vibrerLegerement();
    setEnCours(pote.id);
    const erreur = accepte ? await accepterDemandeBande(pote.id) : await retirerDemandeBande(pote.id);
    setEnCours(null);
    const message = erreur
      ? "Ça n'a pas marché cette fois. Réessaie dans un instant ?"
      : accepte
        ? `${pote.prenom} a rejoint ta bande !`
        : `C'est noté : ${pote.prenom} n'en saura rien.`;
    setSouci(erreur ? message : null);
    AccessibilityInfo.announceForAccessibility(message);
  }

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre text-xl text-encre">
        Ils veulent rejoindre ta bande
      </Text>
      {demandesRecues.map((pote) => (
        <View key={pote.id} className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pote.prenom}, @${pote.pseudo}`}
            accessibilityHint="Ouvre son profil"
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
              accessibilityLabel={`Accepter ${pote.prenom}`}
              accessibilityState={{ disabled: enCours === pote.id }}
              disabled={enCours === pote.id}
              onPress={() => void repondre(pote, true)}
              className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-encre">{enCours === pote.id ? "Un instant…" : "Accepter"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pas maintenant pour ${pote.prenom}`}
              accessibilityHint="La personne n'est pas prévenue"
              accessibilityState={{ disabled: enCours === pote.id }}
              disabled={enCours === pote.id}
              onPress={() => void repondre(pote, false)}
              className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-encre">Pas maintenant</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {souci ? <Text className="font-texte text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text> : null}
    </View>
  );
}
