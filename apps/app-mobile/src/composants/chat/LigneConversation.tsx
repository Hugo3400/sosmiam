import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Conversation } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { resumerDernierMessage } from "~/fonctions/chat/resumer-dernier-message";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Props = {
  conversation: Conversation;
  /** L'heure de l'écran (rafraîchie de temps en temps) : « 14h32 » devient « Hier » sans quitter la liste */
  maintenant: Date;
};

const TAILLE_AVATAR = 52;
const TAILLE_MINI = 22;

/**
 * Une conversation dans la liste des messages : l'avatar (le pote, ou l'emoji du groupe avec deux de ses membres),
 * le nom, l'aperçu du dernier message, son moment (« 14h32 », « Hier », « lun. ») et les non-lus. Lue d'un seul bloc.
 */
export function LigneConversation({ conversation, maintenant }: Props) {
  const router = useRouter();
  const { trouverPote, bloques } = utiliserCommunaute();
  const { nonLusDe } = utiliserConversations();

  const groupe = conversation.type === "groupe";
  const nonLus = nonLusDe(conversation.id);
  // Les autres membres, sans toi ni les personnes bloquées
  const autres = conversation.participants
    .filter((id) => id !== ID_MOI && !bloques.some((b) => b.id === id))
    .map(trouverPote)
    .filter((p): p is Pote => p !== null);
  const pote = groupe ? null : (autres[0] ?? null);
  const nom = groupe ? conversation.titre || "Groupe sans nom" : (pote?.prenom ?? "Quelqu'un");

  const dernier = conversation.messages[conversation.messages.length - 1];
  const prefixe = !dernier ? null : dernier.auteur === ID_MOI ? "Toi" : groupe ? (trouverPote(dernier.auteur)?.prenom ?? "Quelqu'un") : null;
  const lieuNom = dernier?.lieuId !== undefined ? lieuxExemples.find((l) => l.id === dernier.lieuId)?.nom : undefined;
  const vide = groupe ? (conversation.creePar === ID_MOI ? "Groupe créé : lance la discussion" : "Nouveau groupe : dis bonjour") : "Pas encore de message : dis-lui bonjour";
  const apercu = dernier ? resumerDernierMessage(dernier, prefixe, lieuNom) : `${vide} 👋`;
  const moment = dernier ? formaterMomentRelatif(dernier.date, maintenant) : null;

  const membres = autres.length + 1;
  const lu = [
    groupe ? `${nom}, groupe de ${membres} personne${membres > 1 ? "s" : ""}` : nom,
    nonLus > 0 ? `${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}` : null,
    dernier ? resumerDernierMessage(dernier, prefixe, lieuNom, true) : vide,
    moment?.lu,
  ]
    .filter(Boolean)
    .join(". ");

  // Un rond avec un emoji : celui du groupe, ou un visage si on ne connaît plus la personne
  const rondEmoji = (emoji: string) => (
    <View style={{ width: TAILLE_AVATAR, height: TAILLE_AVATAR, borderRadius: TAILLE_AVATAR / 2 }} className="items-center justify-center border-2 border-encre bg-jaune-clair">
      {/* Taille fixe : l'emoji suit le rond, pas la taille de texte du système */}
      <Text allowFontScaling={false} style={{ fontSize: TAILLE_AVATAR * 0.48, lineHeight: TAILLE_AVATAR * 0.62 }}>
        {emoji}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint="Ouvre la conversation"
      onPress={() => {
        vibrerLegerement();
        router.push({ pathname: "/potes/discussion/[id]", params: { id: conversation.id } });
      }}
      className="min-h-[76px] flex-row items-center gap-3 border-b border-ligne py-3 active:opacity-70"
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: TAILLE_AVATAR + 4, height: TAILLE_AVATAR }}>
        {groupe ? rondEmoji(conversation.emoji || "💬") : pote ? <RondPote pote={pote} taille={TAILLE_AVATAR} /> : rondEmoji("🙂")}
        {groupe && autres.length > 0 ? (
          <View className="absolute -bottom-1 right-0 flex-row">
            {autres.slice(0, 2).map((p, i) => (
              <View key={p.id} className={`rounded-full border-2 border-creme ${i > 0 ? "-ml-2.5" : ""}`}>
                <RondPote pote={p} taille={TAILLE_MINI} />
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className={`flex-1 text-base text-encre ${nonLus > 0 ? "font-texte-gras" : "font-texte-semi"}`}>
            {nom}
          </Text>
          {moment ? <Text className={`text-xs ${nonLus > 0 ? "font-texte-gras text-encre" : "font-texte text-gris"}`}>{moment.court}</Text> : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className={`flex-1 text-sm ${nonLus > 0 ? "font-texte-semi text-encre" : "font-texte text-gris"}`}>
            {lierPonctuation(apercu)}
          </Text>
          {nonLus > 0 ? (
            <View className="min-w-6 items-center rounded-full bg-rouge-texte px-1.5 py-0.5">
              <Text allowFontScaling={false} className="font-texte-gras text-xs text-white">
                {nonLus > 99 ? "99+" : nonLus}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
