import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Pressable, Text, View, type PressableProps } from "react-native";
import Animated, { FadeOut, ZoomIn, useReducedMotion } from "react-native-reanimated";

import type { Pote } from "@sos-miam/commun/types/potes";
import { AlbumChat } from "~/composants/chat/AlbumChat";
import { CarteLieuChat } from "~/composants/chat/CarteLieuChat";
import { CarteMessageSysteme } from "~/composants/chat/CarteMessageSysteme";
import { CarteSondageChat } from "~/composants/chat/CarteSondageChat";
import { CitationMessage } from "~/composants/chat/CitationMessage";
import { GifChat } from "~/composants/chat/GifChat";
import { GlisserPourRepondre } from "~/composants/chat/GlisserPourRepondre";
import { NoteVocale } from "~/composants/chat/NoteVocale";
import { PauseMessageLimite } from "~/composants/chat/PauseMessageLimite";
import { PhotoChat } from "~/composants/chat/PhotoChat";
import { ReactionsMessage } from "~/composants/chat/ReactionsMessage";
import { TexteMessageChat } from "~/composants/chat/TexteMessageChat";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_MEDIAS_CHAT as T_MEDIAS } from "~/contenus/textes-medias-chat";
import { TEXTES_MESSAGES as T_MESSAGES } from "~/contenus/textes-messages";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { decrireEnvoiMessage } from "~/fonctions/chat/decrire-envoi-message";
import { decrireMomentMessage } from "~/fonctions/chat/decrire-moment-message";
import { estMessageToutEmoji } from "~/fonctions/chat/est-message-tout-emoji";
import { vibrerJaime } from "~/fonctions/interaction/vibrer-jaime";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserMediaChat } from "~/hooks/utiliser-media-chat";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { estGlissementReponseRecent } from "~/services/glissement-reponse";

type Props = {
  conversationId: string;
  message: MessageChatEnrichi;
  album: MessageChatEnrichi[] | null;
  participants: string[];
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
  maintenant: Date;
  deplie: boolean;
  dernierDeMoi: boolean;
  onBasculerDetail: () => void;
  onDoubleToucher: () => void;
  onRepondre?: () => void;
  onVoirCitation?: (id: string) => void;
  pseudos?: ReadonlySet<string>;
  vu?: { vu: string; lu: string } | null;
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
 * Texte, lieu, photo ou note vocale, puis les réactions dessous. Double appui sur la bulle : un 😋 ; appui long ou « ⋯ » : le menu.
 */
export function BulleChat(props: Props) {
  const { conversationId, message, album, participants, auteur, deMoi, heure, debutSerie, groupe, onOptions, maintenant, deplie, dernierDeMoi, onBasculerDetail, onDoubleToucher } = props;
  const { onRepondre, onVoirCitation, pseudos, vu } = props;
  const couleurs = utiliserCouleurs();
  const { basculerReaction, renvoyer, envoisEnPause, retirerEnPause } = utiliserConversations();
  const { trouverPote } = utiliserCommunaute();
  const serie = album ?? [message];
  const echecs = serie.filter((m) => m.etat === "echec");
  // Pas parti parce que ton compte est limité : ni « Réessaie » ni renvoi, mais « Retirer »
  const enPause = echecs.some((m) => envoisEnPause.has(m.id));
  const etatEnvoi = echecs.length > 0 ? "echec" : serie.some((m) => m.etat === "envoi") ? "envoi" : null;
  const monId = utiliserMonId();
  const animationsReduites = useReducedMotion();
  const dernierAppui = useRef(0);
  // Le cœur qui éclot sur la bulle au double appui (son numéro relance l'animation), puis s'efface
  const [coeur, setCoeur] = useState<number | null>(null);
  const minuterieCoeur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minuterieDetail = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (minuterieCoeur.current) clearTimeout(minuterieCoeur.current);
      if (minuterieDetail.current) clearTimeout(minuterieDetail.current);
    },
    [],
  );

  const coeurMis = (message.reactions[T_MESSAGES.emojiDoubleToucher] ?? []).includes(monId);
  // Le fichier de la photo ou de la note : sur le téléphone (démo, ton envoi en cours), ou téléchargé depuis le serveur
  const media = utiliserMediaChat(conversationId, message);
  const fichier = media.fichier;
  // Un message caché (supprimé, modération…) ou pas encore parti ne reçoit pas de réaction
  const cache = message.etat === "supprime" || message.etat === "masque" || message.etat === "retire" || message.etat === "illisible" ? message.etat : null;
  const reactionsPossibles = !message.etat;

  /** Met ou retire ton « miam » ; vrai s'il vient d'être mis */
  function basculerCoeur(): boolean {
    if (!reactionsPossibles) return false;
    basculerReaction(conversationId, message.id, T_MESSAGES.emojiDoubleToucher);
    return !coeurMis;
  }

  function coeurParDoubleAppui() {
    onDoubleToucher();
    vibrerJaime();
    if (!basculerCoeur() || animationsReduites) return;
    setCoeur(Date.now());
    if (minuterieCoeur.current) clearTimeout(minuterieCoeur.current);
    minuterieCoeur.current = setTimeout(() => setCoeur(null), 700);
  }

  function appuiSurLaBulle() {
    if (estGlissementReponseRecent()) return;
    const instant = Date.now();
    if (minuterieDetail.current) clearTimeout(minuterieDetail.current);
    minuterieDetail.current = null;
    if (instant - dernierAppui.current < DELAI_DOUBLE_APPUI) {
      dernierAppui.current = 0;
      coeurParDoubleAppui();
      return;
    }
    dernierAppui.current = instant;
    minuterieDetail.current = setTimeout(() => {
      minuterieDetail.current = null;
      onBasculerDetail();
    }, DELAI_DOUBLE_APPUI);
  }

  function appuiSurLaCarte() {
    const instant = Date.now();
    if (instant - dernierAppui.current < DELAI_DOUBLE_APPUI) {
      dernierAppui.current = 0;
      coeurParDoubleAppui();
      return;
    }
    dernierAppui.current = instant;
  }

  function ouvrirOptions() {
    vibrerLegerement();
    onOptions();
  }

  const reponseA = message.reponseA;
  const auteurCite = !reponseA ? null : reponseA.auteur === monId ? "Toi" : reponseA.auteur ? (trouverPote(reponseA.auteur)?.prenom ?? "Quelqu'un") : "Compte supprimé";
  const mentionne = !deMoi && (message.mentions ?? []).includes(monId);
  const complements: string[] = [];
  if (message.modifieLe) complements.push(T_MESSAGES.modifie);
  if (mentionne) complements.push(T_MESSAGES.mentionne);
  const suite = complements.map((c) => ` · ${c}`).join("");
  const suiteLue = complements.map((c) => `, ${c}`).join("");

  // Un auteur qui a supprimé son compte : « Compte supprimé » (ses messages restent)
  const prenom = deMoi ? "Toi" : (auteur?.prenom ?? (message.auteur === "" ? "Compte supprimé" : "Quelqu'un"));
  const avecPrenom = !deMoi && groupe && debutSerie;
  const coins = deMoi ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-tl-md";
  const fond = deMoi ? "bg-jaune" : "bg-carte";

  // VoiceOver : le « miam » et le menu en actions (balayer vers le haut ou le bas), sur l'élément qui porte le message
  const actionsLecteur: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction"> = {
    accessibilityActions: [
      { name: "coeur", label: coeurMis ? "Retirer ton miam" : "Dire miam" },
      ...(onRepondre && !message.etat && !message.systeme ? [{ name: "repondre", label: T_MESSAGES.repondre }] : []),
      ...(reponseA && onVoirCitation ? [{ name: "citation", label: T_MESSAGES.voirCitation }] : []),
      ...(message.systeme ? [] : [{ name: "options", label: deMoi ? "Réagir" : "Réagir, signaler ou bloquer" }]),
    ],
    onAccessibilityAction: (evenement) => {
      const action = evenement.nativeEvent.actionName;
      if (action === "coeur") {
        vibrerJaime();
        AccessibilityInfo.announceForAccessibility(basculerCoeur() ? "Cœur mis" : "Cœur retiré");
      } else if (action === "repondre") {
        onRepondre?.();
      } else if (action === "citation" && reponseA) {
        onVoirCitation?.(reponseA.id);
      } else if (action === "options") {
        onOptions();
      }
    },
  };

  if (message.systeme) {
    return (
      <CarteMessageSysteme systeme={message.systeme} texte={message.texte ?? ""} heure={heure} onPress={reactionsPossibles ? appuiSurLaCarte : undefined} actionsLecteur={actionsLecteur}>
        <ReactionsMessage conversationId={conversationId} message={message} deMoi={false} centre />
      </CarteMessageSysteme>
    );
  }

  let contenu: ReactNode;
  if (cache || ((message.type === "photo" || message.type === "vocal") && media.etat === "expire")) {
    const texte = cache ? ETATS_CACHES[cache] : "Ce média a expiré";
    contenu = (
      <Pressable
        accessibilityLabel={`${prenom}, ${heure} : ${texte}`}
        onLongPress={ouvrirOptions}
        delayLongPress={DELAI_APPUI_LONG}
        className={`border-2 border-dashed border-gris/50 px-3.5 py-2.5 ${coins} bg-carte/60`}
      >
        <Text className="font-texte text-sm italic text-gris">{lierPonctuation(texte)}</Text>
      </Pressable>
    );
  } else if (message.type === "lieu") {
    contenu = <CarteLieuChat conversationId={conversationId} lieuId={message.lieuId} contexte={`${prenom}, ${heure}`} onAppuiLong={onOptions} actionsLecteur={actionsLecteur} />;
  } else if (message.type === "photo" && ((album && album.length > 1) || serie.some((m) => m.legende))) {
    contenu = (
      <AlbumChat
        conversationId={conversationId}
        photos={serie}
        legende={serie.find((m) => m.legende)?.legende}
        deMoi={deMoi}
        prenom={prenom}
        libelle={deMoi ? `Tes photos, ${heure}` : `Photos de ${prenom}, ${heure}`}
        onAppuiLong={onOptions}
        onAppuiTexte={appuiSurLaBulle}
        onDoubleAppui={() => {
          onDoubleToucher();
          return basculerCoeur();
        }}
        actionsLecteur={actionsLecteur}
      />
    );
  } else if (message.type === "photo") {
    contenu = (
      <PhotoChat
        conversationId={conversationId}
        message={message}
        prenom={prenom}
        fichier={fichier}
        libelle={deMoi ? `Ta photo, ${heure}` : `Photo de ${prenom}, ${heure}`}
        deMoi={deMoi}
        onAppuiLong={onOptions}
        onDoubleAppui={() => {
          onDoubleToucher();
          return basculerCoeur();
        }}
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
          onde={message.onde}
          libelle={deMoi ? `Ta note vocale, ${heure}` : `Note vocale de ${prenom}, ${heure}`}
          deMoi={deMoi}
          onAppuiLong={onOptions}
          actionsLecteur={actionsLecteur}
        />
      </Pressable>
    );
  } else if (message.type === "gif" && message.gif) {
    contenu = (
      <GifChat
        gif={message.gif}
        deMoi={deMoi}
        libelle={deMoi ? T_MEDIAS.tonGifLu(heure) : T_MEDIAS.gifLu(prenom, heure)}
        onPress={appuiSurLaBulle}
        onAppuiLong={ouvrirOptions}
        actionsLecteur={actionsLecteur}
      />
    );
  } else if (message.type === "vote" && message.vote) {
    contenu = (
      <CarteSondageChat
        conversationId={conversationId}
        messageId={message.id}
        vote={message.vote}
        deMoi={deMoi}
        participants={participants}
        maintenant={maintenant}
        onAppuiLong={ouvrirOptions}
        actionsLecteur={actionsLecteur}
      />
    );
  } else {
    const texte = message.texte ?? "";
    const enGrand = !reponseA && estMessageToutEmoji(texte);
    contenu = (
      <Pressable
        accessibilityLabel={`${prenom}, ${heure}${suiteLue}${reponseA ? `, en réponse à ${auteurCite}` : ""} : ${texte}`}
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
          <>
            {reponseA ? (
              <CitationMessage citation={reponseA} auteur={auteurCite} deMoi={deMoi} onPress={onVoirCitation ? () => onVoirCitation(reponseA.id) : undefined} />
            ) : null}
            {/* Espace insécable avant « ? ! : ; » : le signe ne part jamais seul à la ligne */}
            <TexteMessageChat texte={texte} pseudos={pseudos} deMoi={deMoi} />
          </>
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
              {T_MESSAGES.emojiDoubleToucher}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );

  const detail = deplie ? decrireMomentMessage(message.date, heure, maintenant, deMoi) : null;
  const envoi = deMoi && dernierDeMoi && !message.etat ? (vu ?? decrireEnvoiMessage(message.date, maintenant)) : null;
  const heureEcrite = detail ? (
    <View accessible accessibilityLabel={`${detail.lu}${suiteLue}`} accessibilityLiveRegion="polite" className={`mt-1 rounded-full border border-ligne bg-carte px-2 py-0.5 ${deMoi ? "" : "ml-1"}`}>
      <Text className="font-texte-semi text-xs text-encre">{`${detail.vu}${suite}`}</Text>
    </View>
  ) : envoi ? (
    <View accessible accessibilityLabel={`${envoi.lu}${suiteLue}`} className="mt-0.5 flex-row items-center gap-1">
      <Ionicons name={vu ? "checkmark-done" : "checkmark"} size={13} color={couleurs.encre} />
      <Text className="font-texte-semi text-xs text-encre">{`${envoi.vu}${suite}`}</Text>
    </View>
  ) : (
    <Text accessibilityElementsHidden importantForAccessibility="no" className={`mt-0.5 font-texte text-[11px] ${mentionne ? "font-texte-semi text-encre" : "text-gris"} ${deMoi ? "" : "ml-1"}`}>
      {`${heure}${suite}`}
    </Text>
  );
  const repondreActif = !!onRepondre && !message.etat;
  const repondre = () => onRepondre?.();

  if (deMoi) {
    return (
      <GlisserPourRepondre actif={repondreActif} onRepondre={repondre}>
        {(icone) => (
          <View className={`max-w-[85%] items-end self-end ${debutSerie ? "mt-3" : "mt-1"}`}>
            {icone}
            {bulle}
            <ReactionsMessage conversationId={conversationId} message={message} deMoi />
            {enPause ? (
              <PauseMessageLimite onRetirer={() => echecs.forEach((m) => retirerEnPause(m.id))} />
            ) : etatEnvoi === "echec" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pas parti. Touche pour réessayer."
                onPress={() => {
                  vibrerLegerement();
                  echecs.forEach((m) => renvoyer(conversationId, m.id));
                }}
                className="mt-0.5 min-h-8 justify-center active:opacity-70"
              >
                <Text className="font-texte-semi text-[12px] text-rouge-texte">{lierPonctuation("Pas parti. Touche pour réessayer.")}</Text>
              </Pressable>
            ) : etatEnvoi === "envoi" ? (
              <Text accessibilityLiveRegion="polite" className="mt-0.5 font-texte text-[11px] text-gris">
                Envoi…
              </Text>
            ) : (
              heureEcrite
            )}
          </View>
        )}
      </GlisserPourRepondre>
    );
  }

  return (
    <GlisserPourRepondre actif={repondreActif} onRepondre={repondre}>
      {(icone) => (
        <View className={`max-w-[92%] flex-row items-start gap-1.5 self-start ${debutSerie ? "mt-3" : "mt-1"}`}>
          {icone}
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
      )}
    </GlisserPourRepondre>
  );
}
