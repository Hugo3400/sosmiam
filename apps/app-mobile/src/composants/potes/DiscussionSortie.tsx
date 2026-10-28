import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, FlatList, Keyboard, Platform, Pressable, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { MessageSortie, Pote } from "@sos-miam/commun/types/potes";
import { CarteMessageSysteme } from "~/composants/chat/CarteMessageSysteme";
import { SuggestionsMentions } from "~/composants/fil/SuggestionsMentions";
import { BulleMessage } from "~/composants/potes/BulleMessage";
import { MenuMessage } from "~/composants/potes/MenuMessage";
import { TEXTES_DISCUSSION_SORTIE_PAR_LANGUE } from "~/contenus/textes-discussion-sortie";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations, type ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import type { MessageSortieEnrichi } from "~/hooks/utiliser-discussion-sortie";
import { utiliserMentionsChamp } from "~/hooks/utiliser-mentions-champ";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Un message prêt à afficher : son auteur, son heure, et le jour à écrire au-dessus quand il change */
export type LigneDiscussion = {
  message: MessageSortieEnrichi;
  auteur: Pote | null;
  deMoi: boolean;
  /** « 14h32 » */
  heure: string;
  /** « Aujourd'hui », « Hier », « Lundi 6 octobre » : seulement sur le premier message du jour */
  jour: string | null;
};

type Props = {
  lignes: LigneDiscussion[];
  /** Envoie un message (utiliserDiscussionSortie) : « interdit » si tu n'es plus dans la sortie */
  envoyer: (texte: string) => ResultatEnvoiChat;
  /** Renvoie un de tes messages qui n'est pas parti */
  renvoyer: (messageId: string) => void;
  /** Compte connecté : il reste des messages plus anciens à lire */
  plusAnciens: boolean;
  onChargerPlusAnciens: () => void;
  /** Place à laisser sous le champ quand le clavier est fermé (barre du bas du téléphone) */
  margeBas: number;
  /** Petit message en haut de l'écran (aussi lu par le lecteur d'écran) */
  onAnnoncer: (texte: string) => void;
  participants: Pote[];
};

const ETATS_CACHES = new Set<MessageSortie["etat"]>(["supprime", "masque", "retire", "illisible"]);

// Distance au bas de la liste sous laquelle on suit les nouveaux messages
const PRES_DU_BAS = 120;

/** La partie « La discussion » d'une sortie : les messages en bulles, et le champ en bas qui reste au-dessus du clavier. */
export function DiscussionSortie({ lignes, envoyer: envoyerTexte, renvoyer, plusAnciens, onChargerPlusAnciens, margeBas, onAnnoncer, participants }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_DISCUSSION_SORTIE_PAR_LANGUE);
  const TM = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const refus: Readonly<Record<Exclude<ResultatEnvoiChat, "ok">, string>> = T.refus;
  const { moi } = utiliserCommunaute();
  const monId = utiliserMonId();
  const animationsReduites = useReducedMotion();
  // Tes messages refusés parce que ton compte est limité : la bulle le dit, sans « Réessaie », et peut être retirée
  const { envoisEnPause, retirerEnPause } = utiliserConversations();
  const liste = useRef<FlatList<LigneDiscussion>>(null);
  const collerEnBas = useRef(true);
  // Date du dernier message déjà là : seuls les plus récents sont annoncés (pas ceux qui redeviennent derniers après un signalement)
  const dernierVu = useRef(lignes[lignes.length - 1]?.message.date ?? "");
  const premierDefilement = useRef(true);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [clavierOuvert, setClavierOuvert] = useState(false);
  // Le message du menu reste gardé pendant que la feuille se referme (il disparaît de la liste dès qu'il est signalé)
  const [menu, setMenu] = useState<{ message: MessageSortie; auteur: Pote | null } | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const aMentionner = useMemo(() => participants.filter((p) => p.id !== monId && !!p.pseudo), [participants, monId]);
  const pseudos = useMemo(() => new Set([...participants.map((p) => p.pseudo), moi.pseudo].filter((p) => !!p).map((p) => p.toLowerCase())), [participants, moi.pseudo]);
  const mentions = utiliserMentionsChamp(texte, aMentionner, (nouveau) => {
    setTexte(nouveau);
    if (erreur) setErreur(null);
  });

  // Clavier ouvert : la barre du bas du téléphone est sous le clavier, le champ n'a plus besoin de s'en écarter
  useEffect(() => {
    const ouverture = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setClavierOuvert(true));
    const fermeture = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setClavierOuvert(false));
    const apresOuverture = Keyboard.addListener("keyboardDidShow", () => {
      if (collerEnBas.current) liste.current?.scrollToEnd({ animated: !animationsReduites });
    });
    return () => {
      ouverture.remove();
      fermeture.remove();
      apresOuverture.remove();
    };
  }, [animationsReduites]);

  // Un pote répond : le lecteur d'écran le lit, sans qu'il faille aller le chercher
  const derniere = lignes[lignes.length - 1];
  useEffect(() => {
    if (!derniere || derniere.message.date <= dernierVu.current) return;
    dernierVu.current = derniere.message.date;
    const prenom = derniere.message.systeme ? TM.sosMiam : (derniere.auteur?.prenom ?? T.quelquUn);
    if (!derniere.deMoi) AccessibilityInfo.announceForAccessibility(T.annonce(prenom, derniere.message.texte));
  }, [derniere, T, TM]);

  function suivreDefilement(evenement: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = evenement.nativeEvent;
    collerEnBas.current = contentSize.height - contentOffset.y - layoutMeasurement.height < PRES_DU_BAS;
  }

  function envoyer() {
    const resultat = envoyerTexte(texte);
    if (resultat === "ok") {
      vibrerLegerement();
      setTexte("");
      mentions.oublierSelection();
      setErreur(null);
      collerEnBas.current = true;
      // Tes propres messages ne sont pas relus : un mot suffit pour savoir que c'est parti (sinon on retouche « Envoyer » pour rien)
      AccessibilityInfo.announceForAccessibility(T.envoye);
      return;
    }
    setErreur(refus[resultat]);
    AccessibilityInfo.announceForAccessibility(retirerEmoji(refus[resultat]));
  }

  const longueur = texte.trim().length;

  return (
    <View className="flex-1">
      <FlatList
        ref={liste}
        data={lignes}
        keyExtractor={(l) => l.message.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : Platform.OS === "web" ? "none" : "on-drag"}
        contentContainerClassName="px-4 pb-3 pt-2"
        onScroll={suivreDefilement}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          // À l'ouverture, on arrive directement sur les derniers messages ; ensuite, on suit les nouveaux en douceur
          if (collerEnBas.current) liste.current?.scrollToEnd({ animated: !premierDefilement.current && !animationsReduites });
          premierDefilement.current = false;
        }}
        ListHeaderComponent={
          <View className="gap-2 pb-2">
            {/* Compte connecté : les derniers messages d'abord, les plus anciens à la demande */}
            {plusAnciens ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  vibrerLegerement();
                  collerEnBas.current = false;
                  onChargerPlusAnciens();
                }}
                className="min-h-11 items-center justify-center self-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
              >
                <Text className="font-texte-gras text-sm text-encre">{T.voirAvant}</Text>
              </Pressable>
            ) : null}
            <Text
              accessibilityLabel={T.confidentialiteLu}
              className="text-center font-texte text-[13px] leading-[18px] text-gris"
            >
              {lierPonctuation(T.confidentialite)}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 px-6 py-10">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
              💬
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(T.vide)}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const precedente = lignes[index - 1];
          const debutSerie = !precedente || item.jour !== null || precedente.message.auteur !== item.message.auteur || !!precedente.message.systeme;
          return (
            <View>
              {item.jour ? (
                <Text accessibilityRole="header" className="mb-1 mt-4 text-center font-texte-semi text-xs uppercase text-gris">
                  {item.jour}
                </Text>
              ) : null}
              {item.message.systeme ? (
                <CarteMessageSysteme systeme={item.message.systeme} texte={item.message.texte} heure={item.heure} />
              ) : (
                <BulleMessage
                  texte={item.message.texte}
                  auteur={item.auteur}
                  deMoi={item.deMoi}
                  heure={item.heure}
                  debutSerie={debutSerie}
                  etat={item.message.etat}
                  onRenvoyer={() => renvoyer(item.message.id)}
                  enPause={envoisEnPause.has(item.message.id)}
                  onRetirer={() => retirerEnPause(item.message.id)}
                  pseudos={pseudos}
                  mentionne={!item.deMoi && (item.message.mentions ?? []).includes(monId)}
                  onOptions={
                    item.deMoi || ETATS_CACHES.has(item.message.etat)
                      ? undefined
                      : () => {
                          // Clavier ouvert, il cacherait le bas de la feuille (« Signaler », « Bloquer », « Annuler ») : on le range d'abord
                          Keyboard.dismiss();
                          setMenu({ message: item.message, auteur: item.auteur });
                          setMenuOuvert(true);
                        }
                  }
                />
              )}
            </View>
          );
        }}
      />

      <View style={{ paddingBottom: clavierOuvert ? 8 : margeBas + 8 }} className="gap-1.5 border-t border-ligne bg-creme px-4 pt-2">
        {mentions.suggestions.length > 0 ? <SuggestionsMentions potes={mentions.suggestions} onChoisir={mentions.mentionner} /> : null}
        {erreur ? (
          <Text accessibilityLabel={retirerEmoji(erreur)} className="font-texte-semi text-sm leading-5 text-rouge-texte">
            {lierPonctuation(erreur)}
          </Text>
        ) : null}
        <View className="flex-row items-end gap-2">
          <TextInput
            accessibilityLabel={erreur ? T.champErreur(retirerEmoji(erreur)) : T.champ}
            accessibilityHint={T.indiceChamp}
            value={texte}
            onChangeText={(nouveau) => {
              setTexte(nouveau);
              if (erreur) setErreur(null);
            }}
            onSelectionChange={mentions.suivreSelection}
            placeholder={T.exempleChamp}
            placeholderTextColor={couleurs.gris}
            selectionColor={couleurs.encre}
            cursorColor={couleurs.encre}
            multiline
            className={`max-h-32 min-h-11 flex-1 rounded-3xl border-2 bg-carte px-4 py-2.5 font-texte text-base text-encre ${erreur ? "border-rouge-texte" : "border-encre"}`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.envoyer}
            onPress={envoyer}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
          >
            <Ionicons name="arrow-up" size={22} color={couleurs.nuit} />
          </Pressable>
        </View>
        {longueur > LONGUEUR_MAX_MESSAGE - 100 ? (
          <Text className={`text-right font-texte text-xs ${longueur > LONGUEUR_MAX_MESSAGE ? "text-rouge-texte" : "text-gris"}`}>
            {longueur}/{LONGUEUR_MAX_MESSAGE}
          </Text>
        ) : null}
      </View>

      <MenuMessage
        visible={menuOuvert}
        message={menu?.message ?? null}
        auteur={menu?.auteur ?? null}
        onFermer={() => setMenuOuvert(false)}
        onBloque={(prenom) => {
          setMenuOuvert(false);
          onAnnoncer(T.bloque(prenom));
        }}
      />
    </View>
  );
}
