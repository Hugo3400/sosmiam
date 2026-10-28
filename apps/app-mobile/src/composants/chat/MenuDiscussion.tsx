import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { RondPote } from "~/composants/potes/RondPote";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { TEXTES_CHAT_LISTE_PAR_LANGUE } from "~/contenus/textes-chat-liste";
import { TEXTES_CHAT_MENUS_PAR_LANGUE } from "~/contenus/textes-chat-menus";
import { TEXTES_INFOS_GROUPE_PAR_LANGUE } from "~/contenus/textes-infos-groupe";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { nommerGroupe } from "~/fonctions/chat/nommer-groupe";

type Props = {
  visible: boolean;
  conversation: ConversationEnrichie | null;
  /** Les autres membres qu'on montre (sans toi ni les personnes bloquées) ; pour un message privé, le pote */
  membres: Pote[];
  onFermer: () => void;
  onVoirProfil: (poteId: string) => void;
  /** Pote bloqué (message privé) : la conversation disparaît, l'écran peut revenir à la liste */
  onBloque: (prenom: string) => void;
  /** Groupe quitté : l'écran peut revenir à la liste */
  onQuitte: (titre: string) => void;
  onVoirGroupe: () => void;
  onAnnoncer: (texte: string) => void;
};

type Vue = "options" | "signaler" | "bloquer" | "quitter" | "effacer";

const TAILLE_MEMBRE = 36;

/**
 * Le menu d'une conversation, dans une feuille qui monte du bas. Message privé : voir le profil, signaler ou bloquer le pote
 * (avec confirmation). Groupe : les membres (vers leur profil), « Infos du groupe » et « Quitter le groupe » (avec confirmation).
 */
export function MenuDiscussion({ visible, conversation, membres, onFermer, onVoirProfil, onBloque, onQuitte, onVoirGroupe, onAnnoncer }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const T_MENUS = utiliserTextes(TEXTES_CHAT_MENUS_PAR_LANGUE);
  const T_INFOS = utiliserTextes(TEXTES_INFOS_GROUPE_PAR_LANGUE);
  const T_LISTE = utiliserTextes(TEXTES_CHAT_LISTE_PAR_LANGUE);
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { moi, potes, bloquer, estSignale } = utiliserCommunaute();
  const { quitterGroupe, couper, effacerPourMoi, epingler } = utiliserConversations();
  const defilement = useRef<ScrollView>(null);
  const titreOptions = useRef<Text>(null);
  const titreConfirmation = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  // Profil déjà signalé en ouvrant le signalement ? Sert à distinguer « Retour » (rien d'envoyé) de « Fermer » (après le merci)
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
    if (vers === "signaler" && pote) setDejaSignale(estSignale(pote.id));
    setVue(vers);
    // Le lecteur d'écran reprend sur le titre de la nouvelle vue (l'élément qu'il lisait vient de disparaître)
    if (vers === "options") setTimeout(() => deplacerFocusLecteurEcran(titreOptions.current), 150);
    if (vers === "bloquer" || vers === "quitter" || vers === "effacer") setTimeout(() => deplacerFocusLecteurEcran(titreConfirmation.current), 150);
  }

  // Retour Android et geste d'échappement de VoiceOver : une vue en arrière
  function reculer() {
    if (vue === "options") onFermer();
    else aller("options");
  }

  const groupe = conversation?.type === "groupe";
  const pote = groupe ? null : (membres[0] ?? null);

  // Fin du signalement : « Fermer » après le merci ferme le menu ; « Retour » sans rien envoyer ramène aux options
  const terminerSignalement = () => (pote && !dejaSignale && estSignale(pote.id) ? onFermer() : aller("options"));
  const prenom = pote?.prenom ?? T_MENUS.cettePersonne;
  const enOptions = !((vue === "signaler" || vue === "bloquer") && pote) && !((vue === "effacer" || vue === "quitter") && conversation);
  // Retiré de ta bande plus tôt : on ne lui annonce pas qu'il en sort
  const dansBande = !!pote && potes.some((p) => p.id === pote.id);
  // Sans titre (effacé par la modération, illisible) : « Groupe » à l'écran, et pas de guillemets dans les phrases
  const vraiTitre = conversation?.titre?.trim() || null;
  const titreGroupe = nommerGroupe(vraiTitre, langue);
  // Compte connecté : couper (ou remettre) les notifications de cette discussion ; les messages arrivent toujours
  const coupee = conversation?.coupee;
  const optionCouper =
    coupee === undefined
      ? []
      : [
          coupee
            ? { cle: "couper" as const, emoji: "🔔", titre: T_MENUS.remettreNotifications, detail: T_MENUS.remettreNotificationsDetail }
            : { cle: "couper" as const, emoji: "🔕", titre: T_MENUS.couperNotifications, detail: T_MENUS.couperNotificationsDetail },
        ];
  const epinglee = conversation?.epinglee === true;
  const optionEpingler = conversation
    ? [epinglee ? { cle: "epingler" as const, emoji: "📌", titre: T.desepingler, detail: T.desepinglerDetail } : { cle: "epingler" as const, emoji: "📌", titre: T.epingler, detail: T.epinglerDetail }]
    : [];
  // Effacer pour soi seul : les autres gardent leurs messages
  const optionEffacer = conversation ? [{ cle: "effacer" as const, emoji: "🧽", titre: T_MENUS.effacer, detail: T_MENUS.effacerDetail }] : [];
  const options = groupe
    ? [
        { cle: "infos" as const, emoji: "👥", titre: T_INFOS.titre, detail: T_MENUS.infosDetail },
        ...optionEpingler,
        ...optionCouper,
        ...optionEffacer,
        { cle: "quitter" as const, emoji: "👋", titre: T_INFOS.quitter, detail: T_MENUS.quitterDetail },
      ]
    : pote
      ? [
          { cle: "profil" as const, emoji: "👤", titre: T_MENUS.voirProfil, detail: T_MENUS.voirProfilDetail },
          ...optionEpingler,
          ...optionCouper,
          ...optionEffacer,
          { cle: "signaler" as const, emoji: "🚩", titre: T_MENUS.signaler(prenom), detail: T_MENUS.signalerDetail },
          { cle: "bloquer" as const, emoji: "🚫", titre: T_MENUS.bloquer(prenom), detail: T_MENUS.bloquerDetail },
        ]
      : [];

  function basculerEpingle(conversationId: string) {
    onFermer();
    void epingler(conversationId, !epinglee).then((resultat) => {
      if (resultat === "plein") onAnnoncer(T.epinglesPleines);
      else if (resultat === "reseau") onAnnoncer(T.epingleRatee);
      else onAnnoncer(epinglee ? T.desepinglee : T.epinglee);
    });
  }

  function confirmation(titre: string, texte: string, action: string, refus: string, faire: () => void) {
    return (
      <View className="gap-4">
        <Text ref={titreConfirmation} accessibilityRole="header" className="font-titre text-2xl text-encre">
          {lierPonctuation(titre)}
        </Text>
        <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(texte)}</Text>
        <Bouton libelle={action} variante="encre" onPress={faire} />
        <Pressable accessibilityRole="button" onPress={() => aller("options")} className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
          <Text className="font-texte-gras text-base text-encre">{refus}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi d'un signalement */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={T_MENUS.fermerMenu} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} className="px-5">
              {enOptions ? (
                <Text ref={titreOptions} accessibilityRole="header" accessibilityLabel={groupe ? titreGroupe : prenom} numberOfLines={1} className="font-titre text-2xl text-encre">
                  {groupe ? `${conversation?.emoji ?? "💬"} ${titreGroupe}` : prenom}
                </Text>
              ) : null}
            </PoigneeFeuille>
            <ScrollView ref={defilement} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
              {vue === "signaler" && pote ? (
                <SignalerContenu cible="profil" cibleId={pote.id} sujet={T_MENUS.profilDe(prenom)} onTermine={terminerSignalement} />
              ) : vue === "bloquer" && pote ? (
                confirmation(
                  T_MENUS.bloquerTitre(prenom),
                  T_MENUS.bloquerDiscussion(prenom, dansBande),
                  T_MENUS.bloquer(prenom),
                  T_MENUS.nonJeReviens,
                  () => {
                    bloquer(pote.id);
                    onBloque(prenom);
                  },
                )
              ) : vue === "effacer" && conversation ? (
                confirmation(
                  T_MENUS.effacerTitre,
                  T_MENUS.effacerTexte,
                  T_MENUS.effacerOui,
                  T_MENUS.effacerNon,
                  () => {
                    effacerPourMoi(conversation.id);
                    onFermer();
                    AccessibilityInfo.announceForAccessibility(T_MENUS.efface);
                  },
                )
              ) : vue === "quitter" && conversation ? (
                confirmation(
                  T_INFOS.quitterTitre(vraiTitre),
                  T_INFOS.quitterDetail,
                  T_INFOS.quitterOui,
                  T_INFOS.quitterNon,
                  () => {
                    quitterGroupe(conversation.id);
                    onQuitte(vraiTitre ?? T_MENUS.leGroupe);
                  },
                )
              ) : (
                <>
                  {groupe ? (
                    <>
                      <Text className="mb-1 font-texte text-sm text-gris">{T_MENUS.membresToiCompris(membres.length + 1)}</Text>
                      {membres.map((m) => (
                        <Pressable
                          key={m.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${m.prenom}, @${m.pseudo}`}
                          accessibilityHint={T_LISTE.ouvreProfil}
                          onPress={() => {
                            vibrerLegerement();
                            onVoirProfil(m.id);
                          }}
                          className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
                        >
                          <RondPote pote={m} taille={TAILLE_MEMBRE} />
                          <View className="flex-1">
                            <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                              {m.prenom}
                            </Text>
                            <Text numberOfLines={1} className="font-texte text-sm text-gris">
                              @{m.pseudo}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                        </Pressable>
                      ))}
                      <View accessible accessibilityLabel={T_MENUS.toiEvidemmentLu} className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5">
                        <RondPote pote={moi} taille={TAILLE_MEMBRE} />
                        <Text className="flex-1 font-texte-gras text-base text-encre">{T_MENUS.toiEvidemment}</Text>
                      </View>
                    </>
                  ) : pote ? (
                    <Text numberOfLines={1} className="mb-1 font-texte text-sm text-gris">
                      @{pote.pseudo}
                    </Text>
                  ) : (
                    <Text className="mb-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(T_MENUS.plusSurSosMiam)}</Text>
                  )}
                  {options.map((o) => (
                    <Pressable
                      key={o.cle}
                      accessibilityRole="button"
                      accessibilityLabel={`${o.titre}, ${o.detail}`}
                      onPress={() => {
                        vibrerLegerement();
                        if (o.cle === "profil" && pote) onVoirProfil(pote.id);
                        else if (o.cle === "infos") onVoirGroupe();
                        else if (o.cle === "epingler" && conversation) basculerEpingle(conversation.id);
                        else if (o.cle === "couper" && conversation) {
                          couper(conversation.id, !coupee);
                          onFermer();
                          AccessibilityInfo.announceForAccessibility(coupee ? T_MENUS.notificationsRemises : T_MENUS.notificationsCoupees);
                        } else if (o.cle !== "profil" && o.cle !== "couper" && o.cle !== "epingler") aller(o.cle);
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
                    <Text className="font-texte-gras text-base text-encre">{T_MENUS.annuler}</Text>
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
