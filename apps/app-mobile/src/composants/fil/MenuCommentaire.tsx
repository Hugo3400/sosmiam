import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  /** Commentaire dont on ouvre les options (null : menu fermé) */
  commentaire: Commentaire | null;
  /** Prénom de l'auteur, ou nom du lieu */
  nomAuteur: string;
  onModifier: (commentaire: Commentaire) => void;
  onSupprimer: (commentaire: Commentaire) => void;
  onSignaler: (commentaire: Commentaire) => void;
  onBloquer: (commentaire: Commentaire) => void;
  onFermer: () => void;
};

type Confirmation = "supprimer" | "bloquer" | null;

/**
 * Les options d'un commentaire, posées au-dessus de la feuille des commentaires (pas de deuxième fenêtre, qu'iOS refuserait d'empiler) :
 * « Modifier » et « Supprimer » sur les tiens ; « Signaler » et « Bloquer » sur ceux des autres (pas de blocage pour le lieu).
 */
export function MenuCommentaire({ commentaire, nomAuteur, onModifier, onSupprimer, onSignaler, onBloquer, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const titre = useRef<Text>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  // Un autre commentaire : on repart des options
  const [ouvertSur, setOuvertSur] = useState(commentaire?.id ?? null);
  if ((commentaire?.id ?? null) !== ouvertSur) {
    setOuvertSur(commentaire?.id ?? null);
    setConfirmation(null);
  }
  if (!commentaire) return null;

  const estMoi = commentaire.auteur === ID_MOI;
  const estLieu = commentaire.auteur === "lieu";

  function confirmer(choix: Confirmation) {
    setConfirmation(choix);
    setTimeout(() => deplacerFocusLecteurEcran(titre.current), 150);
  }

  function reculer() {
    if (confirmation) confirmer(null);
    else onFermer();
  }

  const options: { cle: string; emoji: string; titre: string; detail: string; action: () => void }[] = estMoi
    ? [
        { cle: "modifier", emoji: "✏️", titre: "Modifier", detail: "Une faute, un mot à ajouter ? On corrige", action: () => onModifier(commentaire) },
        { cle: "supprimer", emoji: "🗑️", titre: "Supprimer", detail: "Il disparaîtra de la publication", action: () => confirmer("supprimer") },
      ]
    : [
        { cle: "signaler", emoji: "🚩", titre: "Signaler", detail: "Insulte, arnaque, contenu choquant…", action: () => onSignaler(commentaire) },
        ...(estLieu
          ? []
          : [{ cle: "bloquer", emoji: "🚫", titre: `Bloquer ${nomAuteur}`, detail: "Tu ne verras plus ses commentaires ni ses messages", action: () => confirmer("bloquer") }]),
      ];

  const titreMenu = confirmation === "supprimer" ? "Supprimer ton commentaire ?" : confirmation === "bloquer" ? `Bloquer ${nomAuteur} ?` : estMoi ? "Ton commentaire" : `Commentaire de ${nomAuteur}`;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer les options" onPress={onFermer} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} />
      </Animated.View>
      <Animated.View entering={SlideInDown.duration(220)} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          style={{ paddingBottom: marges.bottom + 12 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme px-5 pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <Text ref={titre} accessibilityRole="header" numberOfLines={2} className="mb-2 font-titre text-2xl text-encre">
            {titreMenu}
          </Text>

          {confirmation ? (
            <View className="gap-3">
              <Text className="font-texte text-base leading-6 text-encre">
                {confirmation === "supprimer"
                  ? "Il disparaîtra de la publication, et ses J'aime avec. Pas de retour en arrière possible."
                  : `${nomAuteur} sort de ta bande, et tu ne verras plus ses commentaires ni ses messages.`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  vibrerLegerement();
                  if (confirmation === "supprimer") onSupprimer(commentaire);
                  else onBloquer(commentaire);
                }}
                className="mt-1 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-rouge-texte active:opacity-80"
              >
                <Text className="font-texte-gras text-base text-white">{confirmation === "supprimer" ? "Supprimer" : `Bloquer ${nomAuteur}`}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => confirmer(null)} className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                <Text className="font-texte-gras text-base text-encre">Non, on garde</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {options.map((o) => (
                <Pressable
                  key={o.cle}
                  accessibilityRole="button"
                  accessibilityLabel={o.titre}
                  accessibilityHint={o.detail}
                  onPress={() => {
                    vibrerLegerement();
                    o.action();
                  }}
                  className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                >
                  <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
                    {o.emoji}
                  </Text>
                  <View className="flex-1">
                    <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                    <Text className="font-texte text-sm text-gris">{o.detail}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                <Text className="font-texte-gras text-base text-encre">Annuler</Text>
              </Pressable>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
