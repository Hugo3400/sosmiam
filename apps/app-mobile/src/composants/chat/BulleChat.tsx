import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Pressable, Text, View, type PressableProps } from "react-native";
import Animated, { FadeOut, ZoomIn, useReducedMotion } from "react-native-reanimated";

import type { MessageChat } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { CarteLieuChat } from "~/composants/chat/CarteLieuChat";
import { NoteVocale } from "~/composants/chat/NoteVocale";
import { PauseMessageLimite } from "~/composants/chat/PauseMessageLimite";
import { PhotoChat } from "~/composants/chat/PhotoChat";
import { ReactionsMessage } from "~/composants/chat/ReactionsMessage";
import { RondPote } from "~/composants/potes/RondPote";
import { estMessageToutEmoji } from "~/fonctions/chat/est-message-tout-emoji";
import { vibrerJaime } from "~/fonctions/interaction/vibrer-jaime";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import couleurs from "~/theme/couleurs";

type Props = {
  conversationId: string;
  message: MessageChat;
  /** Qui l'a écrit (null si on ne le connaît plus) */
  auteur: Pote | null;
  deMoi: boolean;
  /** Heure, déjà écrite : « 14h32 » */
  heure: string;
  /** Premier message d'une série du même auteur : son avatar, et son prénom dans un groupe */
  debutSerie: boolean;
  groupe: boolean;
  /** Menu du message (réactions, signaler, bloquer), par appui long ou par « ⋯ » */
  onOptions: () => void;
};

const TAILLE_AVATAR = 32;

/** Ce qu'on montre à la place d'un message qui n'est plus visible (compte connecté) */
const ETATS_CACHES: Record<"supprime" | "masque" | "retire" | "illisible", string> = {
  supprime: "Message supprimé",
  masque: "🛡️ Masqué en attendant la modération",
  retire: "🛡️ Retiré par la modération",
  illisible: "Message illisible",
};
const DELAI_DOUBLE_APPUI = 300;
const DELAI_APPUI_LONG = 350;

/**
 * Un message du chat : les tiens à droite en jaune, ceux des potes à gauche avec leur avatar (et leur prénom dans un groupe).
 * Texte, lieu, photo ou note vocale, puis les réactions dessous. Double appui sur la bulle : un ❤️ ; appui long ou « ⋯ » : le menu.
 */
export function BulleChat({ conversationId, message, auteur, deMoi, heure, debutSerie, groupe, onOptions }: Props) {
  const { basculerReaction, renvoyer, envoisEnPause } = utiliserConversations();
  const monId = utiliserMonId();
  const animationsReduites = useReducedMotion();
  const dernierAppui = useRef(0);
  // Le cœur qui éclot sur la bulle au double appui (son numéro relance l'animation), puis s'efface
  const [coeur, setCoeur] = useState<number | null>(null);
  const minuterieCoeur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (minuterieCoeur.current) clearTimeout(minuterieCoeur.current);
    },
    [],
  );

  const coeurMis = (message.reactions["❤️"] ?? []).includes(monId);
  // Le fichier de la photo ou de la note : sur le téléphone (démo, ton envoi en cours), ou téléchargé depuis le serveur
  const media = utiliserMediaChat(conversationId, message);
  const fichier = media.fichier;
  // Un message caché (supprimé, modération…) ou pas encore parti ne reçoit pas de réaction
  const cache = message.etat === "supprime" || message.etat === "masque" || message.etat === "retire" || message.etat === "illisible" ? message.etat : null;
  const reactionsPossibles = !message.etat;

  /** Met ou retire ton cœur ; vrai s'il vient d'être mis */
  function basculerCoeur(): boolean {
    if (!reactionsPossibles) return false;
    basculerReaction(conversationId, message.id, "❤️");
    return !coeurMis;
  }

  function coeurParDoubleAppui() {
    vibrerJaime();
    if (!basculerCoeur() || animationsReduites) return;
    setCoeur(Date.now());
    if (minuterieCoeur.current) clearTimeout(minuterieCoeur.current);
    minuterieCoeur.current = setTimeout(() => setCoeur(null), 700);
  }

  // Un appui seul ne fait rien sur la bulle : rien à retarder. Deux appuis rapprochés : le cœur
  function appuiSurLaBulle() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_DOUBLE_APPUI) {
      dernierAppui.current = 0;
      coeurParDoubleAppui();
      return;
    }
    dernierAppui.current = maintenant;
  }

  function ouvrirOptions() {
    vibrerLegerement();
    onOptions();
  }

  // Un auteur qui a supprimé son compte : « Compte supprimé » (ses messages restent)
  const prenom = deMoi ? "Toi" : (auteur?.prenom ?? (message.auteur === "" ? "Compte supprimé" : "Quelqu'un"));
  const avecPrenom = !deMoi && groupe && debutSerie;
  const coins = deMoi ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-tl-md";
  const fond = deMoi ? "bg-jaune" : "bg-white";

  // VoiceOver : le cœur et le menu en actions (balayer vers le haut ou le bas), sur l'élément qui porte le message
  const actionsLecteur: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction"> = {
    accessibilityActions: [
      { name: "coeur", label: coeurMis ? "Retirer ton cœur" : "Mettre un cœur" },
      { name: "options", label: deMoi ? "Réagir" : "Réagir, signaler ou bloquer" },
    ],
    onAccessibilityAction: (evenement) => {
      if (evenement.nativeEvent.actionName === "coeur") {
        vibrerJaime();
        AccessibilityInfo.announceForAccessibility(basculerCoeur() ? "Cœur mis" : "Cœur retiré");
      } else if (evenement.nativeEvent.actionName === "options") {
        onOptions();
      }
    },
  };

  let contenu: ReactNode;
  if (cache || ((message.type === "photo" || message.type === "vocal") && media.etat === "expire")) {
    const texte = cache ? ETATS_CACHES[cache] : "Ce média a expiré";
    contenu = (
      <Pressable
        accessibilityLabel={`${prenom}, ${heure} : ${texte}`}
        onLongPress={ouvrirOptions}
        delayLongPress={DELAI_APPUI_LONG}
        className={`border-2 border-dashed border-gris/50 px-3.5 py-2.5 ${coins} bg-white/60`}
      >
        <Text className="font-texte text-sm italic text-gris">{lierPonctuation(texte)}</Text>
      </Pressable>
    );
  } else if (message.type === "lieu") {
    contenu = <CarteLieuChat conversationId={conversationId} lieuId={message.lieuId} contexte={`${prenom}, ${heure}`} onAppuiLong={onOptions} actionsLecteur={actionsLecteur} />;
  } else if (message.type === "photo") {
    contenu = (
      <PhotoChat
        fichier={fichier}
        libelle={deMoi ? `Ta photo, ${heure}` : `Photo de ${prenom}, ${heure}`}
        deMoi={deMoi}
        onAppuiLong={onOptions}
        onDoubleAppui={basculerCoeur}
        actionsLecteur={actionsLecteur}
      />
    );
  } else if (message.type === "vocal") {
    // La bulle elle-même n'est pas lue : le bouton lecture porte la note (et ses actions)
    contenu = (
      <Pressable accessible={false} onPress={appuiSurLaBulle} onLongPress={ouvrirOptions} delayLongPress={DELAI_APPUI_LONG} className={`border-2 border-encre px-3 py-2 ${coins} ${fond}`}>
        <NoteVocale
          fichier={fichier}
          dureeSecondes={message.dureeSecondes}
          libelle={deMoi ? `Ta note vocale, ${heure}` : `Note vocale de ${prenom}, ${heure}`}
          deMoi={deMoi}
          onAppuiLong={onOptions}
          actionsLecteur={actionsLecteur}
        />
      </Pressable>
    );
  } else {
    const texte = message.texte ?? "";
    const enGrand = estMessageToutEmoji(texte);
    contenu = (
      <Pressable
        accessibilityLabel={`${prenom}, ${heure} : ${texte}`}
        onPress={appuiSurLaBulle}
        onLongPress={ouvrirOptions}
        delayLongPress={DELAI_APPUI_LONG}
        {...actionsLecteur}
        className={enGrand ? "px-1 active:opacity-80" : `border-2 border-encre px-3.5 py-2.5 active:opacity-80 ${coins} ${fond}`}
      >
        {enGrand ? (
          // Quelques emoji seuls : en grand, sans bulle (taille fixe, ils sont déjà gros)
          <Text allowFontScaling={false} style={{ fontSize: 44, lineHeight: 54 }}>
            {texte.trim()}
          </Text>
        ) : (
          // Espace insécable avant « ? ! : ; » : le signe ne part jamais seul à la ligne
          <Text className="font-texte text-base leading-[22px] text-encre">{lierPonctuation(texte)}</Text>
        )}
      </Pressable>
    );
  }

  const bulle = (
    <View>
      {contenu}
      {coeur !== null ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View key={coeur} entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(250)}>
            <Text allowFontScaling={false} style={{ fontSize: 40, lineHeight: 48 }}>
              ❤️
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );

  const heureEcrite = (
    <Text accessibilityElementsHidden importantForAccessibility="no" className={`mt-0.5 font-texte text-[11px] text-gris ${deMoi ? "" : "ml-1"}`}>
      {heure}
    </Text>
  );

  if (deMoi) {
    return (
      <View className={`max-w-[85%] items-end self-end ${debutSerie ? "mt-3" : "mt-1"}`}>
        {bulle}
        <ReactionsMessage conversationId={conversationId} message={message} deMoi />
        {message.etat === "echec" && envoisEnPause.has(message.id) ? (
          <PauseMessageLimite />
        ) : message.etat === "echec" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pas parti. Touche pour réessayer."
            onPress={() => {
              vibrerLegerement();
              renvoyer(conversationId, message.id);
            }}
            className="mt-0.5 min-h-8 justify-center active:opacity-70"
          >
            <Text className="font-texte-semi text-[12px] text-rouge-texte">{lierPonctuation("Pas parti. Touche pour réessayer.")}</Text>
          </Pressable>
        ) : message.etat === "envoi" ? (
          <Text accessibilityLiveRegion="polite" className="mt-0.5 font-texte text-[11px] text-gris">
            Envoi…
          </Text>
        ) : (
          heureEcrite
        )}
      </View>
    );
  }

  return (
    <View className={`max-w-[92%] flex-row items-start gap-1.5 self-start ${debutSerie ? "mt-3" : "mt-1"}`}>
      <View style={{ width: TAILLE_AVATAR }} className={avecPrenom ? "pt-5" : ""}>
        {debutSerie && auteur ? <RondPote pote={auteur} taille={TAILLE_AVATAR} /> : null}
      </View>
      <View className="shrink items-start">
        {avecPrenom ? (
          // Déjà lu avec le message : pas besoin de le lire deux fois
          <Text accessibilityElementsHidden importantForAccessibility="no" numberOfLines={1} className="mb-0.5 ml-1 font-texte-semi text-[13px] text-gris">
            {prenom}
          </Text>
        ) : null}
        {bulle}
        <ReactionsMessage conversationId={conversationId} message={message} deMoi={false} />
        {heureEcrite}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Options du message de ${prenom}`}
        accessibilityHint="Réagir, signaler ce message ou bloquer cette personne"
        hitSlop={{ left: 4, right: 4 }}
        onPress={ouvrirOptions}
        className={`h-11 w-9 items-center justify-center active:opacity-60 ${avecPrenom ? "mt-5" : ""}`}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
