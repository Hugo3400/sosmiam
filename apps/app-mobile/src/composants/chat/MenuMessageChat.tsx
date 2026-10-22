import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { REACTIONS_CHAT, type MessageChat, type ReactionChat } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { formaterDureeVocal } from "~/fonctions/chat/formater-duree-vocal";
import { formaterDureeVocalLue } from "~/fonctions/chat/formater-duree-vocal-lue";
import { nommerReactionChat } from "~/fonctions/chat/nommer-reaction-chat";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";

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
// Le temps que la feuille se referme : la confirmation n'est pas coupée par le lecteur d'écran qui revient sur la conversation
const DELAI_ANNONCE_REACTION = 400;

/** Ce qu'on signale : « ce message », « cette photo », « cette note vocale », « ce lieu partagé » */
const SUJETS: Record<MessageChat["type"], string> = { texte: "ce message", lieu: "ce lieu partagé", photo: "cette photo", vocal: "cette note vocale" };

/** Le message en petit, en haut de la feuille, pour savoir de quoi on parle : ce qu'on voit, et ce que lit le lecteur d'écran (sans emoji) */
function resumer(message: MessageChat, nomDuLieu: (id: number) => string | undefined): { vu: string; lu: string } {
  if (message.type === "lieu") {
    const nom = (message.lieuId === undefined ? undefined : nomDuLieu(message.lieuId)) ?? "un lieu";
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
 * d'un pote, le signaler ou bloquer son auteur (avec confirmation). Pour tes messages : les réactions, et avec un compte,
 * « Supprimer pour tout le monde ».
 */
export function MenuMessageChat({ visible, conversationId, message, auteur, deMoi, onFermer, onBloque }: Props) {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { bloquer, potes, estSignale } = utiliserCommunaute();
  const monId = utiliserMonId();
  const { basculerReaction, trouverConversation, supprimerMessage, source } = utiliserConversations();
  const { trouverLieu } = utiliserLieux();
  const defilement = useRef<ScrollView>(null);
  const titreOptions = useRef<Text>(null);
  const titreBlocage = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  // Déjà signalé en ouvrant le signalement ? Sert à distinguer « Retour » (rien d'envoyé) de « Fermer » (après le merci)
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

  // Fin du signalement : « Fermer » après le merci ferme le menu ; « Retour » sans rien envoyer ramène aux options
  const terminerSignalement = () => (message && !dejaSignale && estSignale(message.id) ? onFermer() : aller("options"));

  /** « Supprimer pour tout le monde », après confirmation (sur le web, Alert n'existe pas : on supprime directement) */
  function demanderSuppression() {
    if (!message) return;
    const supprimer = () => {
      supprimerMessage(conversationId, message.id);
      onFermer();
      AccessibilityInfo.announceForAccessibility("Message supprimé pour tout le monde.");
    };
    if (Platform.OS === "web") return supprimer();
    Alert.alert("Supprimer ce message ?", "Il disparaît pour tout le monde. Il restera juste « Message supprimé » à sa place.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: supprimer },
    ]);
  }

  /** Met ou retire ta réaction, referme la feuille, et le lecteur d'écran confirme (comme le cœur de la bulle) */
  function reagir(reaction: ReactionChat, dejaChoisie: boolean) {
    if (!message) return;
    vibrerLegerement();
    basculerReaction(conversationId, message.id, reaction);
    onFermer();
    const annonce = `Réaction ${nommerReactionChat(reaction)} ${dejaChoisie ? "retirée" : "mise"}`;
    setTimeout(() => {
      if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(annonce, { queue: true });
      else AccessibilityInfo.announceForAccessibility(annonce);
    }, DELAI_ANNONCE_REACTION);
  }

  const prenom = auteur?.prenom ?? "cette personne";
  const enOptions = deMoi || !((vue === "signaler" && message) || (vue === "bloquer" && auteur));
  // Quelqu'un d'un groupe n'est pas forcément dans ta bande : on ne lui annonce pas qu'il en sort
  const dansBande = !!auteur && potes.some((p) => p.id === auteur.id);
  const sujet = message ? SUJETS[message.type] : "ce message";
  // Les réactions bougent pendant que la feuille est ouverte (un pote réagit) : on lit la version à jour quand elle existe encore
  const reactions = (message && trouverConversation(conversationId)?.messages.find((m) => m.id === message.id)?.reactions) ?? message?.reactions ?? {};
  const resume = message ? resumer(message, (id) => trouverLieu(id)?.nom) : null;
  // Compte connecté : ton message déjà parti se supprime pour tout le monde (il reste « Message supprimé »)
  const supprimable = deMoi && source === "compte" && !!message && !message.etat;
  const options = deMoi
    ? supprimable
      ? [{ cle: "supprimer" as const, emoji: "🗑️", titre: "Supprimer pour tout le monde", detail: "Il restera « Message supprimé » dans la discussion" }]
      : []
    : [
        { cle: "signaler" as const, emoji: "🚩", titre: "Signaler ce message", detail: "Insulte, harcèlement, arnaque… dis-nous ce qui cloche" },
        ...(auteur ? [{ cle: "bloquer" as const, emoji: "🚫", titre: `Bloquer ${prenom}`, detail: "Tu ne verras plus ses messages ni ses commentaires" }] : []),
      ];

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi d'un signalement */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} className="px-5">
              {enOptions ? (
                <Text ref={titreOptions} accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">
                  {deMoi ? "Ton message" : `Message de ${prenom}`}
                </Text>
              ) : null}
            </PoigneeFeuille>
            <ScrollView ref={defilement} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
              {vue === "signaler" && message && !deMoi ? (
                <SignalerContenu cible="message" cibleId={message.id} sujet={`${sujet} de ${prenom}`} onTermine={terminerSignalement} />
              ) : vue === "bloquer" && auteur && !deMoi ? (
                <View className="gap-4">
                  <Text ref={titreBlocage} accessibilityRole="header" className="font-titre text-2xl text-encre">
                    {lierPonctuation(`Bloquer ${prenom} ?`)}
                  </Text>
                  <Text className="font-texte text-base leading-6 text-encre">
                    {lierPonctuation(
                      dansBande
                        ? `${prenom} sortira de ta bande, ses messages disparaîtront pour toi et vous ne pourrez plus vous écrire en privé. Tu restes tranquille, c'est tout ce qui compte.`
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
                  <Pressable accessibilityRole="button" onPress={() => aller("options")} className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
                    <Text className="font-texte-gras text-base text-encre">Non, je reviens</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {resume ? (
                    <View accessible accessibilityLabel={resume.lu} className="mb-3 rounded-2xl border-2 border-ligne bg-carte px-3.5 py-2.5">
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
                          const choisie = (reactions[reaction] ?? []).includes(monId);
                          return (
                            <Pressable
                              key={reaction}
                              accessibilityRole="button"
                              accessibilityState={{ selected: choisie }}
                              accessibilityLabel={`${nommerReactionChat(reaction)}, réaction ${i + 1} sur ${REACTIONS_CHAT.length}`}
                              accessibilityHint={choisie ? "Retire ta réaction" : "Réagis à ce message"}
                              onPress={() => reagir(reaction, choisie)}
                              style={{ width: TAILLE_REACTION, height: TAILLE_REACTION, borderRadius: TAILLE_REACTION / 2 }}
                              className={`items-center justify-center border-2 active:opacity-70 ${choisie ? "border-encre bg-jaune" : "border-ligne bg-carte"}`}
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
                        if (o.cle === "supprimer") return demanderSuppression();
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
                  <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
                    <Text className="font-texte-gras text-base text-encre">Annuler</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
