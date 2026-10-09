import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import type { NotificationSuivi } from "@sos-miam/commun/types/suivis";
import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { RondPote } from "~/composants/potes/RondPote";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";

type Props = {
  notification: NotificationSuivi;
  /** Phrase, emoji et destination (decrireNotificationSuivi) */
  description: NotificationDecrite;
  /** La personne dont parle la notification (son avatar dans le rond), ou null (lieu, créateur, anniversaire) */
  pote: Pote | null;
  /** Arrivée depuis ta visite précédente : mise en avant (fond jaune clair, point jaune) */
  nouvelle: boolean;
  /** Dernière ligne de la carte : pas de trait dessous */
  derniere: boolean;
};

const TAILLE_ROND = 44;

/** Ce que la ligne ouvre, lu par VoiceOver après la phrase */
const indiceDe = (notification: NotificationSuivi) => {
  if (notification.type === "majorite") return undefined;
  if (notification.cle.startsWith("personne:")) return "Ouvre son profil";
  return notification.cle.startsWith("lieu:") ? "Ouvre la fiche du lieu" : "Ouvre sa page";
};

/**
 * Une notification : le rond (avatar de la personne, 🎬, emoji du lieu ou 🎂), la phrase et le moment (« 14h32 », « Hier »).
 * Toucher la ligne ouvre le profil, la page du créateur ou la fiche du lieu. Une nouveauté se lit « Nouveau » en premier.
 */
export function LigneNotification({ notification, description, pote, nouvelle, derniere }: Props) {
  const router = useRouter();
  const moment = formaterMomentRelatif(notification.date);
  const { ouvrir } = description;
  const libelle = `${nouvelle ? "Nouveau. " : ""}${retirerEmoji(description.texte)}${description.alcool ? `. ${MESSAGE_SANITAIRE_ALCOOL}` : ""}, ${moment.lu}`;
  const classe = `min-h-16 flex-row items-center gap-3 px-3 py-3 ${nouvelle ? "bg-jaune-clair/50" : ""} ${derniere ? "" : "border-b border-ligne"}`;

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
          <Text allowFontScaling={false} style={{ fontSize: 22, lineHeight: 28 }}>
            {description.emoji}
          </Text>
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

  if (!ouvrir) {
    return (
      <View accessible accessibilityLabel={libelle} className={classe}>
        {contenu}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={indiceDe(notification)}
      onPress={() => {
        vibrerLegerement();
        router.push(ouvrir);
      }}
      className={`${classe} active:opacity-70`}
    >
      {contenu}
    </Pressable>
  );
}
