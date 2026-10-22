import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View, type AccessibilityActionEvent } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { RondPote } from "~/composants/potes/RondPote";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import type { NotificationApp } from "~/hooks/utiliser-notifications";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  notification: NotificationApp;
  /** Phrase, emoji et destination (decrireNotificationSuivi) */
  description: NotificationDecrite;
  /** La personne dont parle la notification (son avatar dans le rond), ou null (lieu, créateur) */
  pote: Pote | null;
  /** Arrivée depuis ta visite précédente : mise en avant (fond jaune clair, point jaune) */
  nouvelle: boolean;
  /** Dernière ligne de la carte : pas de trait dessous */
  derniere: boolean;
  /** Un bouton sous la phrase, à côté de ce qu'elle ouvre (« Retirer » quelqu'un arrivé dans ta bande) */
  action?: ReactNode;
  onOptions?: () => void;
  onEffacer?: () => void;
};

const TAILLE_ROND = 44;
const DEBUT_TEXTE = 12 + TAILLE_ROND + 12;
const ACTIONS_LECTEUR = [{ name: "effacer", label: "Effacer" }];

/** Ce que la ligne ouvre, lu par VoiceOver après la phrase */
const indiceDe = (notification: NotificationApp, description: NotificationDecrite) => {
  if (description.indice) return description.indice;
  if (notification.type === "cloche") return undefined;
  if (notification.cle.startsWith("personne:")) return "Ouvre son profil";
  return notification.cle.startsWith("lieu:") ? "Ouvre la fiche du lieu" : "Ouvre sa page";
};

/**
 * Une notification : le rond (avatar de la personne, 🎬 ou emoji du lieu), la phrase et le moment (« 14h32 », « Hier »).
 * Toucher la ligne ouvre le profil, la page du créateur ou la fiche du lieu. Une nouveauté se lit « Nouveau » en premier.
 */
export function LigneNotification({ notification, description, pote, nouvelle, derniere, action, onOptions, onEffacer }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const moment = formaterMomentRelatif(notification.date);
  const { ouvrir } = description;
  const libelle = `${nouvelle ? "Nouveau. " : ""}${retirerEmoji(description.texte)}${description.alcool ? `. ${MESSAGE_SANITAIRE_ALCOOL}` : ""}, ${moment.lu}`;
  const fond = `${nouvelle ? "bg-jaune-clair/50" : ""} ${derniere ? "" : "border-b border-ligne"}`;
  const auBout = action !== undefined || onOptions !== undefined;
  // Jamais un bouton dans un bouton
  const classe = `min-h-16 flex-row items-center gap-3 px-3 ${action !== undefined ? "pb-2 pt-3" : "py-3"} ${auBout ? "" : fond}`;
  const lecteur = onEffacer
    ? {
        accessibilityActions: ACTIONS_LECTEUR,
        onAccessibilityAction: (e: AccessibilityActionEvent) => {
          if (e.nativeEvent.actionName === "effacer") onEffacer();
        },
      }
    : {};
  const appuiLong = onOptions
    ? {
        delayLongPress: 400,
        onLongPress: () => {
          vibrerLegerement();
          onOptions();
        },
      }
    : {};

  const contenu = (
    <>
      {pote ? (
        <RondPote pote={pote} taille={TAILLE_ROND} />
      ) : (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: TAILLE_ROND, height: TAILLE_ROND, borderRadius: TAILLE_ROND / 2 }}
          className="items-center justify-center border-2 border-encre bg-jaune"
        >
          <EmojiOuMiami valeur={description.emoji} taille={TAILLE_ROND - 4} allowFontScaling={false} style={{ fontSize: 22, lineHeight: 28 }} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className={`text-[15px] leading-5 text-encre ${nouvelle ? "font-texte-semi" : "font-texte"}`}>{description.texte}</Text>
        {description.alcool ? <MentionPrevention variante="courte" /> : null}
        <Text className="font-texte text-[13px] text-gris">{moment.court}</Text>
      </View>
      {nouvelle ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="h-2.5 w-2.5 rounded-full border border-encre bg-jaune" /> : null}
    </>
  );

  const ligne = !ouvrir ? (
    <Pressable accessible accessibilityLabel={libelle} {...lecteur} {...appuiLong} className={classe}>
      {contenu}
    </Pressable>
  ) : (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={indiceDe(notification, description)}
      {...lecteur}
      {...appuiLong}
      onPress={() => {
        vibrerLegerement();
        router.push(ouvrir);
      }}
      className={`${classe} active:opacity-70`}
    >
      {contenu}
    </Pressable>
  );
  if (!auBout) return ligne;
  return (
    <View className={`flex-row items-center gap-1 ${onOptions ? "pr-1" : "pr-3"} ${fond}`}>
      <View className="flex-1">
        {ligne}
        {action !== undefined ? (
          <View className="flex-row" style={{ paddingLeft: DEBUT_TEXTE }}>
            {action}
          </View>
        ) : null}
      </View>
      {onOptions ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Plus d'options : ${retirerEmoji(description.texte)}`}
          accessibilityHint="Pour effacer cette notification"
          hitSlop={4}
          onPress={() => {
            vibrerLegerement();
            onOptions();
          }}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={couleurs.gris} />
        </Pressable>
      ) : null}
    </View>
  );
}
