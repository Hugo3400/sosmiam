import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState, type ReactElement } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { CarteInvitationGroupe } from "~/composants/chat/CarteInvitationGroupe";
import { FeuilleNouveauMessage } from "~/composants/chat/FeuilleNouveauMessage";
import { LigneConversation } from "~/composants/chat/LigneConversation";
import { RechercheDiscussions } from "~/composants/chat/RechercheDiscussions";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_CHAT_LISTE_PAR_LANGUE } from "~/contenus/textes-chat-liste";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { filtrerConversations } from "~/fonctions/chat/filtrer-conversations";
import { listerNomsConversation } from "~/fonctions/chat/lister-noms-conversation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserBrouillonsChat } from "~/hooks/utiliser-brouillons-chat";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  enTete: ReactElement;
  margeBas: number;
};

type LigneListe = { cle: string; titre: string; icone: "pin" | "chatbubbles-outline" } | { cle: string; conversation: ConversationEnrichie };

export function ContenuMessages({ enTete, margeBas }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T_MESSAGES = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_CHAT_LISTE_PAR_LANGUE);
  const router = useRouter();
  const { pret, conversations, invitations } = utiliserConversations();
  const { pret: communautePrete, potes, trouverPote, bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const brouillons = utiliserBrouillonsChat();
  const { maintenantMs } = utiliserHorlogeMinute();
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");

  const maintenant = useMemo(() => new Date(maintenantMs), [maintenantMs]);
  const idsBloques = new Set(bloques.map((b) => b.id));
  const affichees = filtrerConversations(conversations, recherche, (c) => listerNomsConversation(c, monId, trouverPote, idsBloques, langue));
  const pretes = pret && communautePrete;
  const cherche = recherche.trim();
  const epinglees = affichees.filter((c) => c.epinglee);
  const lignes: LigneListe[] =
    epinglees.length === 0
      ? affichees.map((c) => ({ cle: c.id, conversation: c }))
      : [
          { cle: "titre-epinglees", titre: T_MESSAGES.sectionEpinglees, icone: "pin" },
          ...epinglees.map((c) => ({ cle: c.id, conversation: c })),
          ...(epinglees.length < affichees.length ? [{ cle: "titre-toutes", titre: T_MESSAGES.sectionToutes, icone: "chatbubbles-outline" as const }] : []),
          ...affichees.filter((c) => !c.epinglee).map((c) => ({ cle: c.id, conversation: c })),
        ];

  const actions = [
    { cle: "message", libelle: T_MESSAGES.nouveauMessage, icone: "create" as const, fond: "bg-jaune", texte: "text-nuit", teinte: couleurs.nuit, indice: T_MESSAGES.indiceNouveauMessage, faire: () => setFeuilleOuverte(true) },
    { cle: "groupe", libelle: T_MESSAGES.nouveauGroupe, icone: "people" as const, fond: "bg-carte", texte: "text-encre", teinte: couleurs.encre, indice: T_MESSAGES.indiceNouveauGroupe, faire: () => router.push("/potes/nouveau-groupe") },
  ];

  if (!pretes) return <View className="px-5">{enTete}</View>;

  return (
    <>
      <FlatList
        data={lignes}
        keyExtractor={(l) => l.cle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: margeBas }}
        renderItem={({ item }) =>
          "conversation" in item ? (
            <LigneConversation conversation={item.conversation} maintenant={maintenant} brouillon={brouillons.get(item.conversation.id)?.texte} />
          ) : (
            <View accessibilityRole="header" className="mt-3 flex-row items-center gap-1.5 pb-1">
              <Ionicons name={item.icone} size={14} color={couleurs.gris} />
              <Text className="font-texte-semi text-xs uppercase text-gris">{item.titre}</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View className="gap-4 pb-3">
            {enTete}
            <View className="flex-row gap-2">
              {actions.map((a) => (
                <View key={a.cle} className="relative flex-1">
                  <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={a.libelle}
                    accessibilityHint={a.indice}
                    onPress={() => {
                      vibrerLegerement();
                      a.faire();
                    }}
                    className={`min-h-12 flex-row items-center justify-center gap-1.5 rounded-full border-2 border-encre px-0.5 active:translate-x-0.5 active:translate-y-0.5 ${a.fond}`}
                  >
                    <Ionicons name={a.icone} size={16} color={a.teinte} />
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} className={`shrink font-texte-gras text-sm ${a.texte}`}>
                      {a.libelle}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
            {conversations.length > 0 ? <RechercheDiscussions valeur={recherche} onChange={setRecherche} /> : null}
            {invitations.map((invitation) => (
              <CarteInvitationGroupe key={invitation.id} invitation={invitation} />
            ))}
          </View>
        }
        ListEmptyComponent={
          cherche ? (
            <View accessibilityLiveRegion="polite" className="mt-2 items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
                🔍
              </Text>
              <Text className="text-center font-texte-gras text-base text-encre">{T_MESSAGES.aucunResultatTitre}</Text>
              <Text className="text-center font-texte text-[15px] leading-6 text-gris">{lierPonctuation(T_MESSAGES.aucunResultat(cherche))}</Text>
            </View>
          ) : (
            <View className="mt-2 items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
                💬
              </Text>
              <Text className="text-center font-texte-gras text-base text-encre">{T.pasEncoreDeDiscussion}</Text>
              <Text className="text-center font-texte text-base leading-6 text-gris">
                {lierPonctuation(
                  potes.length > 0
                    ? T.messagerieCalme
                    : T.messagerieSansPote,
                )}
              </Text>
              {potes.length === 0 ? <Bouton libelle={T.ajouterPote} variante="blanc" petit onPress={() => router.push("/potes/ajouter")} /> : null}
            </View>
          )
        }
        ListFooterComponent={
          <Text
            accessibilityLabel={T.confidentialiteListeLu}
            className="mt-6 text-center font-texte text-[13px] leading-[18px] text-gris"
          >
            {lierPonctuation(T.confidentialiteListe)}
          </Text>
        }
      />
      <FeuilleNouveauMessage visible={feuilleOuverte} onFermer={() => setFeuilleOuverte(false)} />
    </>
  );
}
