import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { TEXTES_CHAT_BULLES_PAR_LANGUE } from "~/contenus/textes-chat-bulles";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { calculerMinutesPourModifier } from "~/fonctions/chat/calculer-minutes-pour-modifier";
import { citerMessage } from "~/fonctions/chat/citer-message";
import { decrireCitation } from "~/fonctions/chat/decrire-citation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  reponseA: MessageChatEnrichi | null;
  edition: MessageChatEnrichi | null;
  onAnnulerReponse: () => void;
  onAnnulerEdition: () => void;
};

export function BandeauReponseChat({ reponseA, edition, onAnnulerReponse, onAnnulerEdition }: Props) {
  const couleurs = utiliserCouleurs();
  const { trouverPote } = utiliserCommunaute();
  const { trouverLieu } = utiliserLieux();
  const monId = utiliserMonId();
  const { maintenantMs } = utiliserHorlogeMinute();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const T_BULLES = utiliserTextes(TEXTES_CHAT_BULLES_PAR_LANGUE);
  const T_APERCUS = utiliserTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE);
  if (!edition && !reponseA) return null;

  let bandeau: { icone: "arrow-undo" | "create-outline"; titre: string; detail: string; fermer: string; onFermer: () => void };
  if (edition) {
    const minutes = calculerMinutesPourModifier(edition.date, new Date(maintenantMs));
    bandeau = { icone: "create-outline", titre: T.modification, detail: minutes > 0 ? T.modifierDetail(minutes) : T_BULLES.quelquesSecondes, fermer: T.annulerModification, onFermer: onAnnulerEdition };
  } else {
    const cite = reponseA!;
    const prenom = cite.auteur === monId ? null : (trouverPote(cite.auteur)?.prenom ?? T_APERCUS.quelquUn);
    const { vu } = decrireCitation(citerMessage(cite), langue, cite.lieuId === undefined ? undefined : trouverLieu(cite.lieuId)?.nom);
    bandeau = {
      icone: "arrow-undo",
      titre: prenom ? T.reponseA(prenom) : T_BULLES.reponseATonMessage,
      detail: vu,
      fermer: prenom ? T.nePlusRepondre(prenom) : T_BULLES.nePlusRepondreTonMessage,
      onFermer: onAnnulerReponse,
    };
  }

  return (
    <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-ligne bg-carte pl-3">
      <View className="w-1 self-stretch rounded-full bg-jaune" style={{ marginVertical: 8 }} />
      <Ionicons name={bandeau.icone} size={18} color={couleurs.encre} />
      <View accessible accessibilityLabel={`${bandeau.titre}. ${bandeau.detail}`} className="flex-1 py-1.5">
        <Text numberOfLines={1} className="font-texte-gras text-[13px] text-encre">
          {bandeau.titre}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {lierPonctuation(bandeau.detail)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={bandeau.fermer}
        onPress={() => {
          vibrerLegerement();
          bandeau.onFermer();
        }}
        className="h-11 w-11 items-center justify-center active:opacity-60"
      >
        <Ionicons name="close" size={20} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
