import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, FlatList, Keyboard, Platform, Pressable, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { MessageSortie, Pote } from "@sos-miam/commun/types/potes";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { BulleMessage } from "~/composants/potes/BulleMessage";
import { MenuMessage } from "~/composants/potes/MenuMessage";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

/** Un message prêt à afficher : son auteur, son heure, et le jour à écrire au-dessus quand il change */
export type LigneDiscussion = {
  message: MessageSortie;
  auteur: Pote | null;
  deMoi: boolean;
  /** « 14h32 » */
  heure: string;
  /** « Aujourd'hui », « Hier », « Lundi 6 octobre » : seulement sur le premier message du jour */
  jour: string | null;
};

type Props = {
  sortieId: string;
  lignes: LigneDiscussion[];
  /** Place à laisser sous le champ quand le clavier est fermé (barre du bas du téléphone) */
  margeBas: number;
  /** Petit message en haut de l'écran (aussi lu par le lecteur d'écran) */
  onAnnoncer: (texte: string) => void;
};

const REFUS: Record<Exclude<ResultatTexte, "ok">, string> = {
  vide: "Écris quelque chose avant d'envoyer, même un petit emoji 😉",
  "trop-long": `Ton message dépasse ${LONGUEUR_MAX_MESSAGE} caractères : coupe un peu, la bande t'écoute quand même.`,
  "mot-interdit": "Oups, un mot de ton message ne passe pas chez nous. Tu reformules gentiment ?",
};

// Distance au bas de la liste sous laquelle on suit les nouveaux messages
const PRES_DU_BAS = 120;

/** La partie « La discussion » d'une sortie : les messages en bulles, et le champ en bas qui reste au-dessus du clavier. */
export function DiscussionSortie({ sortieId, lignes, margeBas, onAnnoncer }: Props) {
  const { envoyerMessage } = utiliserCommunaute();
  const animationsReduites = useReducedMotion();
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
    if (!derniere.deMoi) AccessibilityInfo.announceForAccessibility(`${derniere.auteur?.prenom ?? "Quelqu'un"} : ${derniere.message.texte}`);
  }, [derniere]);

  function suivreDefilement(evenement: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = evenement.nativeEvent;
    collerEnBas.current = contentSize.height - contentOffset.y - layoutMeasurement.height < PRES_DU_BAS;
  }

  function envoyer() {
    const resultat = envoyerMessage(sortieId, texte);
    if (resultat === "ok") {
      vibrerLegerement();
      setTexte("");
      setErreur(null);
      collerEnBas.current = true;
      // Tes propres messages ne sont pas relus : un mot suffit pour savoir que c'est parti (sinon on retouche « Envoyer » pour rien)
      AccessibilityInfo.announceForAccessibility("Message envoyé à la bande");
      return;
    }
    setErreur(REFUS[resultat]);
    AccessibilityInfo.announceForAccessibility(REFUS[resultat].replace(/ 😉/, ""));
  }

  const longueur = texte.trim().length;

  return (
    <View className="flex-1">
      <FlatList
        ref={liste}
        data={lignes}
        keyExtractor={(l) => l.message.id}
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
        ListHeaderComponent={
          <View className="gap-2 pb-2">
            <BandeauDemoPotes />
            <Text
              accessibilityLabel="Seuls les participants de la sortie voient cette discussion. Un message qui dérange ? Touche « Options du message » à côté, ou appui long dessus, pour le signaler."
              className="text-center font-texte text-[13px] leading-[18px] text-gris"
            >
              {lierPonctuation("🔒 Seuls les participants de la sortie voient cette discussion. Un message qui dérange ? Appui long dessus, ou « ⋯ », pour le signaler.")}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 px-6 py-10">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
              💬
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation("Pas encore de message. Lance la discussion : un « qui est chaud ? », un emoji, tout est permis !")}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const precedente = lignes[index - 1];
          const debutSerie = !precedente || item.jour !== null || precedente.message.auteur !== item.message.auteur;
          return (
            <View>
              {item.jour ? (
                <Text accessibilityRole="header" className="mb-1 mt-4 text-center font-texte-semi text-xs uppercase text-gris">
                  {item.jour}
                </Text>
              ) : null}
              <BulleMessage
                texte={item.message.texte}
                auteur={item.auteur}
                deMoi={item.deMoi}
                heure={item.heure}
                debutSerie={debutSerie}
                onOptions={
                  item.deMoi
                    ? undefined
                    : () => {
                        // Clavier ouvert, il cacherait le bas de la feuille (« Signaler », « Bloquer », « Annuler ») : on le range d'abord
                        Keyboard.dismiss();
                        setMenu({ message: item.message, auteur: item.auteur });
                        setMenuOuvert(true);
                      }
                }
              />
            </View>
          );
        }}
      />

      <View style={{ paddingBottom: clavierOuvert ? 8 : margeBas + 8 }} className="gap-1.5 border-t border-ligne bg-creme px-4 pt-2">
        {erreur ? <Text className="font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreur)}</Text> : null}
        <View className="flex-row items-end gap-2">
          <TextInput
            accessibilityLabel={erreur ? `Ton message. ${erreur}` : "Ton message"}
            value={texte}
            onChangeText={(nouveau) => {
              setTexte(nouveau);
              if (erreur) setErreur(null);
            }}
            placeholder="Écris à la bande…"
            placeholderTextColor={couleurs.gris}
            selectionColor={couleurs.encre}
            cursorColor={couleurs.encre}
            multiline
            className={`max-h-32 min-h-11 flex-1 rounded-3xl border-2 bg-white px-4 py-2.5 font-texte text-base text-encre ${erreur ? "border-rouge-texte" : "border-encre"}`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            onPress={envoyer}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
          >
            <Ionicons name="arrow-up" size={22} color={couleurs.encre} />
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
          onAnnoncer(`🚫 C'est fait : tu ne verras plus les messages de ${prenom}`);
        }}
      />
    </View>
  );
}
