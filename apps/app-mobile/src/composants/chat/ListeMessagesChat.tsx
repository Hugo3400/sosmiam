import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react";
import {
  AccessibilityInfo,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import type { Conversation, MessageChat } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { BulleChat } from "~/composants/chat/BulleChat";
import { MenuMessageChat } from "~/composants/chat/MenuMessageChat";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { construireLignesDiscussion, type LigneDiscussion } from "~/fonctions/chat/construire-lignes-discussion";
import { decrireMessageRecu } from "~/fonctions/chat/decrire-message-recu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

/** Ce que l'écran peut demander à la liste */
export type PoigneeListeMessages = {
  /** Revient en bas et suit les nouveaux messages (après un envoi) */
  allerEnBas: () => void;
};

type Props = {
  conversation: Conversation;
  /** Les autres membres qu'on montre (sans toi ni les personnes bloquées) ; pour un message privé, le pote */
  membres: Pote[];
  /** Photos et notes vocales permises (sinon, le haut de la liste explique pourquoi) */
  mediasPermis: boolean;
  /** Un ou une 15-17 ans dans la conversation : pas de bar proposé */
  mineurPresent: boolean;
  /** Quelqu'un bloqué depuis le menu d'un message (la feuille est déjà fermée) */
  onBloque: (prenom: string) => void;
  ref?: Ref<PoigneeListeMessages>;
};

// Distance au bas de la liste sous laquelle on suit les nouveaux messages
const PRES_DU_BAS = 120;

const cleLigne = (ligne: LigneDiscussion) => ligne.message.id;
const nomDuLieu = (lieuId: number | undefined) => (lieuId === undefined ? undefined : lieuxExemples.find((l) => l.id === lieuId)?.nom);

/**
 * Les messages d'une conversation : jour au-dessus de chaque nouvelle journée, séries par auteur, bulles BulleChat.
 * Reste collée en bas tant qu'on y est ; les messages des potes sont lus par le lecteur d'écran dès qu'ils arrivent.
 */
export function ListeMessagesChat({ conversation, membres, mediasPermis, mineurPresent, onBloque, ref }: Props) {
  const { trouverPote } = utiliserCommunaute();
  const animationsReduites = useReducedMotion();
  const liste = useRef<FlatList<LigneDiscussion>>(null);
  const collerEnBas = useRef(true);
  const premierDefilement = useRef(true);
  const [aujourdhui, setAujourdhui] = useState(() => new Date());
  // Messages des potes arrivés pendant que tu relisais plus haut
  const [nouveaux, setNouveaux] = useState(0);
  // Le message du menu reste gardé pendant que la feuille se referme (il disparaît de la liste dès qu'il est signalé)
  const [menu, setMenu] = useState<{ message: MessageChat; auteur: Pote | null; deMoi: boolean } | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);

  const conversationId = conversation.id;
  const groupe = conversation.type === "groupe";
  const lignes = useMemo(() => construireLignesDiscussion(conversation.messages, trouverPote, aujourdhui), [conversation.messages, trouverPote, aujourdhui]);
  // Date du dernier message déjà là : seuls les plus récents sont annoncés (pas ceux qui redeviennent derniers après un signalement)
  const dernierVu = useRef(lignes[lignes.length - 1]?.message.date ?? "");

  const allerEnBas = useCallback(() => {
    collerEnBas.current = true;
    setNouveaux(0);
    liste.current?.scrollToEnd({ animated: !animationsReduites });
  }, [animationsReduites]);
  useImperativeHandle(ref, () => ({ allerEnBas }), [allerEnBas]);

  // Minuit passe : « Aujourd'hui » devient « Hier » sans quitter l'écran
  useEffect(() => {
    const minuterie = setInterval(() => setAujourdhui((avant) => (new Date().toDateString() === avant.toDateString() ? avant : new Date())), 60_000);
    return () => clearInterval(minuterie);
  }, []);

  // Clavier ouvert : les derniers messages restent visibles au-dessus du champ
  useEffect(() => {
    const ouverture = Keyboard.addListener("keyboardDidShow", () => {
      if (collerEnBas.current) liste.current?.scrollToEnd({ animated: !animationsReduites });
    });
    return () => ouverture.remove();
  }, [animationsReduites]);

  // Un nouveau message : le tien te ramène en bas ; celui d'un pote est lu par le lecteur d'écran, sans qu'il faille aller le chercher.
  // Avant l'affichage, pour que le défilement qui suit la nouvelle bulle sache déjà s'il doit coller en bas.
  const derniere = lignes[lignes.length - 1];
  useLayoutEffect(() => {
    if (!derniere || derniere.message.date <= dernierVu.current) return;
    dernierVu.current = derniere.message.date;
    if (derniere.deMoi) {
      collerEnBas.current = true;
      setNouveaux(0);
      return;
    }
    if (!collerEnBas.current) setNouveaux((n) => n + 1);
    AccessibilityInfo.announceForAccessibility(decrireMessageRecu(derniere.message, derniere.auteur?.prenom ?? "Quelqu'un", nomDuLieu(derniere.message.lieuId)));
  }, [derniere]);

  function suivreDefilement(evenement: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = evenement.nativeEvent;
    collerEnBas.current = contentSize.height - contentOffset.y - layoutMeasurement.height < PRES_DU_BAS;
    if (collerEnBas.current) setNouveaux((n) => (n === 0 ? n : 0));
  }

  const ouvrirMenu = useCallback((ligne: LigneDiscussion) => {
    setMenu({ message: ligne.message, auteur: ligne.auteur, deMoi: ligne.deMoi });
    setMenuOuvert(true);
  }, []);

  const afficherLigne = useCallback(
    ({ item }: ListRenderItemInfo<LigneDiscussion>) => (
      <View>
        {item.jour ? (
          <Text accessibilityRole="header" className="mb-1 mt-4 text-center font-texte-semi text-xs uppercase text-gris">
            {item.jour}
          </Text>
        ) : null}
        <BulleChat
          conversationId={conversationId}
          message={item.message}
          auteur={item.auteur}
          deMoi={item.deMoi}
          heure={item.heure}
          debutSerie={item.debutSerie}
          groupe={groupe}
          onOptions={() => ouvrirMenu(item)}
        />
      </View>
    ),
    [conversationId, groupe, ouvrirMenu],
  );

  const prive = groupe ? null : (membres[0]?.prenom ?? null);
  const confidentialite = prive ? `🔒 Rien qu'entre ${prive} et toi.` : "🔒 Seuls les membres de la conversation voient ces messages.";
  const protection = !mediasPermis
    ? "🛡️ Il y a des 15-17 ans dans la conversation : pas de photo, pas de vocal, pas de bar. Les emoji, eux, sont illimités."
    : mineurPresent
      ? "🛡️ Il y a des 15-17 ans dans la conversation : pas de bar proposé. Les emoji, eux, sont illimités."
      : null;

  const enTete = useMemo(
    () => (
      <View className="gap-2 pb-2">
        <BandeauDemoPotes />
        <Text
          accessibilityLabel={`${confidentialite.replace("🔒 ", "")} Un message qui dérange ? Touche « Options du message » à côté, ou appui long dessus, pour le signaler.`}
          className="text-center font-texte text-[13px] leading-[18px] text-gris"
        >
          {lierPonctuation(`${confidentialite} Un message qui dérange ? Appui long dessus, ou « ⋯ », pour le signaler.`)}
        </Text>
        {protection ? (
          <Text accessibilityLabel={protection.replace("🛡️ ", "")} className="text-center font-texte text-[13px] leading-[18px] text-gris">
            {lierPonctuation(protection)}
          </Text>
        ) : null}
      </View>
    ),
    [confidentialite, protection],
  );

  const vide = useMemo(
    () => (
      <View className="items-center gap-2 px-6 py-10">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
          👋
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-xl text-encre">
          Tout est encore à écrire
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation(
            mediasPermis
              ? "Dis bonjour, envoie un lieu, un vocal, une photo… Le premier message, c'est comme une entrée : ça ouvre l'appétit !"
              : "Dis bonjour, envoie un lieu, un emoji… Le premier message, c'est comme une entrée : ça ouvre l'appétit !",
          )}
        </Text>
      </View>
    ),
    [mediasPermis],
  );

  return (
    <View className="flex-1">
      <FlatList
        ref={liste}
        data={lignes}
        keyExtractor={cleLigne}
        renderItem={afficherLigne}
        initialNumToRender={20}
        maxToRenderPerBatch={12}
        windowSize={11}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerClassName="px-4 pb-3 pt-2"
        onScroll={suivreDefilement}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          // À l'ouverture, on arrive directement sur les derniers messages ; ensuite, on suit les nouveaux en douceur
          if (collerEnBas.current) liste.current?.scrollToEnd({ animated: !premierDefilement.current && !animationsReduites });
          premierDefilement.current = false;
        }}
        ListHeaderComponent={enTete}
        ListEmptyComponent={vide}
      />

      {nouveaux > 0 ? (
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-3 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${nouveaux} ${nouveaux > 1 ? "nouveaux messages" : "nouveau message"}, aller en bas`}
            onPress={() => {
              vibrerLegerement();
              allerEnBas();
            }}
            className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
          >
            <Ionicons name="arrow-down" size={16} color={couleurs.encre} />
            <Text className="font-texte-gras text-sm text-encre">{nouveaux > 1 ? `${nouveaux} nouveaux messages` : "1 nouveau message"}</Text>
          </Pressable>
        </View>
      ) : null}

      <MenuMessageChat
        visible={menuOuvert}
        conversationId={conversationId}
        message={menu?.message ?? null}
        auteur={menu?.auteur ?? null}
        deMoi={menu?.deMoi ?? false}
        onFermer={() => setMenuOuvert(false)}
        onBloque={(prenom) => {
          setMenuOuvert(false);
          onBloque(prenom);
        }}
      />
    </View>
  );
}
