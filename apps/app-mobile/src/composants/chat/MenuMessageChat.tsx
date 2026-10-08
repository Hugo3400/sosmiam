import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { REACTIONS_CHAT, type MessageChat } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { formaterDureeVocal } from "~/fonctions/chat/formater-duree-vocal";
import { formaterDureeVocalLue } from "~/fonctions/chat/formater-duree-vocal-lue";
import { nommerReactionChat } from "~/fonctions/chat/nommer-reaction-chat";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  conversationId: string;
  /** Le message visé (à garder tant que la feuille est ouverte : il disparaît de la conversation dès qu'il est signalé) */
  message: MessageChat | null;
  /** Son auteur (null si on ne le connaît plus : on peut alors seulement réagir et signaler) */
  auteur: Pote | null;
  /** Ton message : seulement les réactions */
  deMoi: boolean;
  onFermer: () => void;
  /** Personne bloquée : la feuille se ferme, l'écran peut le dire */
  onBloque: (prenom: string) => void;
};

type Vue = "options" | "signaler" | "bloquer";

const TAILLE_REACTION = 52;

/** Ce qu'on signale : « ce message », « cette photo », « cette note vocale », « ce lieu partagé » */
const SUJETS: Record<MessageChat["type"], string> = { texte: "ce message", lieu: "ce lieu partagé", photo: "cette photo", vocal: "cette note vocale" };

/** Le message en petit, en haut de la feuille, pour savoir de quoi on parle : ce qu'on voit, et ce que lit le lecteur d'écran (sans emoji) */
function resumer(message: MessageChat): { vu: string; lu: string } {
  if (message.type === "lieu") {
    const nom = lieuxExemples.find((l) => l.id === message.lieuId)?.nom ?? "un lieu";
    return { vu: `📍 ${nom}`, lu: `Un lieu partagé : ${nom}` };
  }
  if (message.type === "photo") return { vu: "📷 Une photo", lu: "Une photo" };
  if (message.type === "vocal") {
    const duree = message.dureeSecondes ? formaterDureeVocalLue(message.dureeSecondes) : null;
    return { vu: `🎙️ Une note vocale${message.dureeSecondes ? ` · ${formaterDureeVocal(message.dureeSecondes)}` : ""}`, lu: `Une note vocale${duree ? ` de ${duree}` : ""}` };
  }
  return { vu: message.texte ?? "", lu: message.texte ?? "" };
}

/**
 * Le menu d'un message du chat, dans une feuille qui monte du bas : une rangée de réactions, puis, pour le message
 * d'un pote, le signaler ou bloquer son auteur (avec confirmation). Pour tes messages : les réactions seulement.
 */
export function MenuMessageChat({ visible, conversationId, message, auteur, deMoi, onFermer, onBloque }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { bloquer } = utiliserCommunaute();
  const { basculerReaction, trouverConversation } = utiliserConversations();
  const defilement = useRef<ScrollView>(null);
  const titreOptions = useRef<Text>(null);
  const titreBlocage = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
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

  const prenom = auteur?.prenom ?? "cette personne";
  const sujet = message ? SUJETS[message.type] : "ce message";
  // Les réactions bougent pendant que la feuille est ouverte (un pote réagit) : on lit la version à jour quand elle existe encore
  const reactions = (message && trouverConversation(conversationId)?.messages.find((m) => m.id === message.id)?.reactions) ?? message?.reactions ?? {};
  const resume = message ? resumer(message) : null;
  const options = deMoi
    ? []
    : [
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
            {vue === "signaler" && message && !deMoi ? (
              <SignalerContenu cible="message" cibleId={message.id} sujet={`${sujet} de ${prenom}`} onTermine={onFermer} />
            ) : vue === "bloquer" && auteur && !deMoi ? (
              <View className="gap-4">
                <Text ref={titreBlocage} accessibilityRole="header" className="font-titre text-2xl text-encre">
                  {lierPonctuation(`Bloquer ${prenom} ?`)}
                </Text>
                <Text className="font-texte text-base leading-6 text-encre">
                  {lierPonctuation(
                    `${prenom} sortira de ta bande, ses messages disparaîtront pour toi et vous ne pourrez plus vous écrire en privé. Tu restes tranquille, c'est tout ce qui compte.`,
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
                  {deMoi ? "Ton message" : `Message de ${prenom}`}
                </Text>
                {resume ? (
                  <View accessible accessibilityLabel={resume.lu} className="mb-3 rounded-2xl border-2 border-ligne bg-white px-3.5 py-2.5">
                    <Text numberOfLines={3} className="font-texte text-[15px] leading-[21px] text-gris">
                      {resume.vu}
                    </Text>
                  </View>
                ) : null}

                {message ? (
                  <View className="mb-2 gap-2">
                    <Text className="font-texte-semi text-sm text-gris">Ta réaction</Text>
                    <View className="flex-row flex-wrap justify-between gap-2">
                      {REACTIONS_CHAT.map((reaction, i) => {
                        const choisie = (reactions[reaction] ?? []).includes(ID_MOI);
                        return (
                          <Pressable
                            key={reaction}
                            accessibilityRole="button"
                            accessibilityState={{ selected: choisie }}
                            accessibilityLabel={`${nommerReactionChat(reaction)}, réaction ${i + 1} sur ${REACTIONS_CHAT.length}`}
                            accessibilityHint={choisie ? "Retire ta réaction" : "Réagis à ce message"}
                            onPress={() => {
                              vibrerLegerement();
                              basculerReaction(conversationId, message.id, reaction);
                              onFermer();
                            }}
                            style={{ width: TAILLE_REACTION, height: TAILLE_REACTION, borderRadius: TAILLE_REACTION / 2 }}
                            className={`items-center justify-center border-2 active:opacity-70 ${choisie ? "border-encre bg-jaune" : "border-ligne bg-white"}`}
                          >
                            {/* Taille fixe : l'emoji reste dans son rond, même avec un grand texte dans les réglages */}
                            <Text allowFontScaling={false} style={{ fontSize: 26, lineHeight: 32 }}>
                              {reaction}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
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
