import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Keyboard, Linking, Platform, Pressable, Text, TextInput, View } from "react-native";

import { ID_MOI, LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { EnregistreurVocal, type ProblemeEnregistrement } from "~/composants/chat/EnregistreurVocal";
import { FeuilleAjoutChat } from "~/composants/chat/FeuilleAjoutChat";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { verifierEnregistrementPossible } from "~/fonctions/chat/verifier-enregistrement-possible";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations, type ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

type Props = {
  conversationId: string;
  /** Place à laisser sous le champ quand le clavier est fermé (barre du bas du téléphone), comme DiscussionSortie */
  margeBas: number;
  /** Un message (texte, lieu, photo ou note vocale) vient de partir : l'écran peut suivre la conversation jusqu'en bas */
  onEnvoye: () => void;
  /** Petit message en haut de l'écran (aussi lu par le lecteur d'écran) */
  onAnnoncer: (texte: string) => void;
};

const REFUS: Record<Exclude<ResultatEnvoiChat, "ok">, string> = {
  vide: "Un message vide, c'est un peu timide 😉 Écris un mot, ou juste un emoji !",
  "trop-long": `Ton message dépasse ${LONGUEUR_MAX_MESSAGE} caractères : coupe un peu, tes potes t'écoutent quand même.`,
  "mot-interdit": "Oups, un mot de ton message ne passe pas chez nous. Tu reformules gentiment ?",
  interdit: "Ce message ne peut pas partir : cette conversation n'est plus ouverte pour toi. Retourne à tes messages pour en lancer une autre.",
};

const MICRO_INDISPONIBLE =
  "Ce navigateur ne sait pas tendre l'oreille 👂 Les notes vocales s'enregistrent depuis l'app SOS Miam sur ton téléphone.";

/**
 * Le champ d'écriture du chat entre potes, qui reste au-dessus du clavier : « + » pour partager un lieu ou une photo,
 * le texte, et le rond jaune qui envoie (ou, champ vide, qui enregistre une note vocale).
 */
export function ChampChat({ conversationId, margeBas, onEnvoye, onAnnoncer }: Props) {
  const { trouverConversation, peutEnvoyerMedias, envoyerTexte } = utiliserConversations();
  const { trouverPote } = utiliserCommunaute();
  const champ = useRef<TextInput>(null);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<ProblemeEnregistrement | null>(null);
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistrementPossible] = useState(verifierEnregistrementPossible);
  // Après une note vocale, le lecteur d'écran revient sur le champ (le bouton qu'il lisait a disparu)
  const revenirAuChamp = useRef(false);

  // Clavier ouvert : la barre du bas du téléphone est sous le clavier, le champ n'a plus besoin de s'en écarter
  useEffect(() => {
    const ouverture = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setClavierOuvert(true));
    const fermeture = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setClavierOuvert(false));
    return () => {
      ouverture.remove();
      fermeture.remove();
    };
  }, []);

  useEffect(() => {
    if (enregistrement || !revenirAuChamp.current) return;
    revenirAuChamp.current = false;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(champ.current), 150);
    return () => clearTimeout(minuterie);
  }, [enregistrement]);

  const conversation = trouverConversation(conversationId);
  const medias = peutEnvoyerMedias(conversationId);
  const pote = conversation?.type === "prive" ? trouverPote(conversation.participants.find((id) => id !== ID_MOI) ?? "") : null;
  const invitation = pote ? `Écris à ${pote.prenom}…` : "Écris au groupe…";
  const longueur = texte.trim().length;
  const micro = longueur === 0 && medias;

  function montrerErreur(probleme: ProblemeEnregistrement) {
    setErreur(probleme);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(probleme.texte));
  }

  function apresEnvoi() {
    vibrerLegerement();
    setErreur(null);
    onEnvoye();
  }

  function envoyer() {
    const resultat = envoyerTexte(conversationId, texte);
    if (resultat === "ok") {
      setTexte("");
      apresEnvoi();
      return;
    }
    montrerErreur({ texte: REFUS[resultat] });
  }

  function lancerEnregistrement() {
    if (!enregistrementPossible) return montrerErreur({ texte: MICRO_INDISPONIBLE });
    Keyboard.dismiss();
    setErreur(null);
    setEnregistrement(true);
  }

  function finirEnregistrement() {
    revenirAuChamp.current = true;
    setEnregistrement(false);
  }

  function ouvrirReglages() {
    Linking.openSettings().catch(() => montrerErreur({ texte: "Les réglages n'ont pas voulu s'ouvrir. Tu les trouveras dans l'appli Réglages de ton téléphone." }));
  }

  return (
    <View style={{ paddingBottom: clavierOuvert ? 8 : margeBas + 8 }} className="gap-1.5 border-t border-ligne bg-creme px-4 pt-2">
      {erreur ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text className="font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreur.texte)}</Text>
          {erreur.reglages && Platform.OS !== "web" ? (
            <Pressable accessibilityRole="link" onPress={ouvrirReglages} hitSlop={8} className="min-h-8 justify-center active:opacity-70">
              <Text className="font-texte-gras text-sm text-encre underline">Ouvrir les réglages</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {enregistrement ? (
        <EnregistreurVocal
          conversationId={conversationId}
          onEnvoye={() => {
            finirEnregistrement();
            apresEnvoi();
          }}
          onAbandon={(probleme) => {
            finirEnregistrement();
            if (probleme) montrerErreur(probleme);
            else onAnnoncer("🗑️ Note vocale à la poubelle : personne ne l'a entendue");
          }}
        />
      ) : (
        <View className="flex-row items-end gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={medias ? "Partager un lieu ou une photo" : "Partager un lieu"}
            onPress={() => {
              vibrerLegerement();
              setFeuilleOuverte(true);
            }}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="add" size={26} color={couleurs.encre} />
          </Pressable>
          <TextInput
            ref={champ}
            accessibilityLabel={erreur ? `Ton message. ${retirerEmojiAnnonce(erreur.texte)}` : "Ton message"}
            value={texte}
            onChangeText={(nouveau) => {
              setTexte(nouveau);
              if (erreur) setErreur(null);
            }}
            placeholder={invitation}
            placeholderTextColor={couleurs.gris}
            selectionColor={couleurs.encre}
            cursorColor={couleurs.encre}
            multiline
            className={`max-h-32 min-h-11 flex-1 rounded-3xl border-2 bg-white px-4 py-2.5 font-texte text-base text-encre ${erreur ? "border-rouge-texte" : "border-encre"}`}
          />
          {micro ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={enregistrementPossible ? "Enregistrer une note vocale" : "Note vocale indisponible ici"}
              accessibilityHint={enregistrementPossible ? "Jusqu'à une minute. L'enregistrement démarre tout de suite." : retirerEmojiAnnonce(MICRO_INDISPONIBLE)}
              onPress={lancerEnregistrement}
              className={`h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80 ${enregistrementPossible ? "" : "opacity-40"}`}
            >
              <Ionicons name="mic" size={22} color={couleurs.encre} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Envoyer"
              onPress={envoyer}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
            >
              <Ionicons name="arrow-up" size={22} color={couleurs.encre} />
            </Pressable>
          )}
        </View>
      )}

      {!enregistrement && longueur > LONGUEUR_MAX_MESSAGE - 100 ? (
        <Text className={`text-right font-texte text-xs ${longueur > LONGUEUR_MAX_MESSAGE ? "text-rouge-texte" : "text-gris"}`}>
          {longueur}/{LONGUEUR_MAX_MESSAGE}
        </Text>
      ) : null}

      <FeuilleAjoutChat
        visible={feuilleOuverte}
        conversationId={conversationId}
        onFermer={() => setFeuilleOuverte(false)}
        onEnvoye={apresEnvoi}
      />
    </View>
  );
}
