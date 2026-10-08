import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MessageSortie, Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  /** Le message visé (à garder tant que la feuille est ouverte : il disparaît de la discussion dès qu'il est signalé) */
  message: MessageSortie | null;
  /** Son auteur (null si on ne le connaît plus : on peut alors seulement signaler) */
  auteur: Pote | null;
  onFermer: () => void;
  /** Personne bloquée : la feuille se ferme, l'écran peut le dire */
  onBloque: (prenom: string) => void;
};

type Vue = "options" | "signaler" | "bloquer";

/** Le menu d'un message d'un pote, dans une feuille qui monte du bas : le signaler, ou bloquer son auteur (avec confirmation). */
export function MenuMessage({ visible, message, auteur, onFermer, onBloque }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { bloquer, potes, estSignale } = utiliserCommunaute();
  const defilement = useRef<ScrollView>(null);
  const titreOptions = useRef<Text>(null);
  const titreBlocage = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
  // Déjà signalé en ouvrant le signalement ? Sert à distinguer « retour » (rien d'envoyé) de « Fermer » (après le merci)
  const [dejaSignale, setDejaSignale] = useState(false);
  // À chaque ouverture, on repart des options (sans montrer l'ancienne vue le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) setVue("options");
  }

  // Chaque vue commence en haut de la feuille
  useEffect(() => {
    defilement.current?.scrollTo({ y: 0, animated: false });
  }, [vue]);

  function aller(vers: Vue) {
    if (vers === "signaler" && message) setDejaSignale(estSignale(message.id));
    setVue(vers);
    // Le lecteur d'écran reprend sur le titre de la nouvelle vue (l'élément qu'il lisait vient de disparaître)
    if (vers === "options") setTimeout(() => deplacerFocusLecteurEcran(titreOptions.current), 150);
    if (vers === "bloquer") setTimeout(() => deplacerFocusLecteurEcran(titreBlocage.current), 150);
  }

  // Retour Android et geste d'échappement de VoiceOver : une vue en arrière
  function reculer() {
    if (vue === "options") onFermer();
    else aller("options");
  }

  // Fin du signalement : « Fermer » après le merci ferme le menu ; le retour sans rien envoyer ramène aux options
  const terminerSignalement = () => (message && !dejaSignale && estSignale(message.id) ? onFermer() : aller("options"));

  const prenom = auteur?.prenom ?? "cette personne";
  // Quelqu'un d'une sortie n'est pas forcément dans ta bande : on ne lui annonce pas qu'il en sort
  const dansBande = !!auteur && potes.some((p) => p.id === auteur.id);
  const options = [
    { cle: "signaler" as const, emoji: "🚩", titre: "Signaler ce message", detail: "Insulte, harcèlement, arnaque… dis-nous ce qui cloche" },
    ...(auteur ? [{ cle: "bloquer" as const, emoji: "🚫", titre: `Bloquer ${prenom}`, detail: "Tu ne verras plus ses messages ni ses commentaires" }] : []),
  ];

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi d'un signalement */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView ref={defilement} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
            {vue === "signaler" && message ? (
              <SignalerContenu cible="message" cibleId={message.id} sujet={`ce message de ${prenom}`} onTermine={terminerSignalement} />
            ) : vue === "bloquer" && auteur ? (
              <View className="gap-4">
                <Text ref={titreBlocage} accessibilityRole="header" className="font-titre text-2xl text-encre">
                  {lierPonctuation(`Bloquer ${prenom} ?`)}
                </Text>
                <Text className="font-texte text-base leading-6 text-encre">
                  {lierPonctuation(
                    dansBande
                      ? `${prenom} sortira de ta bande, et ses messages et ses commentaires disparaîtront pour toi. Tu restes tranquille, c'est tout ce qui compte.`
                      : "Ses messages et ses commentaires disparaîtront pour toi. Tu restes tranquille, c'est tout ce qui compte.",
                  )}
                </Text>
                <Bouton
                  libelle={`Bloquer ${prenom}`}
                  variante="encre"
                  onPress={() => {
                    bloquer(auteur.id);
                    onBloque(prenom);
                  }}
                />
                <Pressable accessibilityRole="button" onPress={() => aller("options")} className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                  <Text className="font-texte-gras text-base text-encre">Non, je reviens</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text ref={titreOptions} accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">
                  {`Message de ${prenom}`}
                </Text>
                {message ? (
                  <View className="mb-2 rounded-2xl border-2 border-ligne bg-white px-3.5 py-2.5">
                    <Text numberOfLines={3} className="font-texte text-[15px] leading-[21px] text-gris">
                      {message.texte}
                    </Text>
                  </View>
                ) : null}
                {options.map((o) => (
                  <Pressable
                    key={o.cle}
                    accessibilityRole="button"
                    accessibilityLabel={`${o.titre}, ${o.detail}`}
                    onPress={() => {
                      vibrerLegerement();
                      aller(o.cle);
                    }}
                    className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                  >
                    <Text className="text-2xl">{o.emoji}</Text>
                    <View className="flex-1">
                      <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                      <Text className="font-texte text-sm text-gris">{o.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                  <Text className="font-texte-gras text-base text-encre">Annuler</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
