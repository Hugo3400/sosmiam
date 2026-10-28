import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Keyboard, Linking, Platform, Pressable, Text, TextInput, View } from "react-native";

import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { BandeauReponseChat } from "~/composants/chat/BandeauReponseChat";
import { EnregistreurVocal, type ProblemeEnregistrement } from "~/composants/chat/EnregistreurVocal";
import { FeuilleAjoutChat } from "~/composants/chat/FeuilleAjoutChat";
import { SuggestionsMentions } from "~/composants/fil/SuggestionsMentions";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { TEXTES_CHAT_CHAMP_PAR_LANGUE } from "~/contenus/textes-chat-champ";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { verifierEnregistrementPossible } from "~/fonctions/chat/verifier-enregistrement-possible";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserBrouillonChat } from "~/hooks/utiliser-brouillon-chat";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations, type ResultatEnvoiChat, type ResultatModificationChat } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserMentionsChamp } from "~/hooks/utiliser-mentions-champ";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  conversationId: string;
  /** Place à laisser sous le champ quand le clavier est fermé (barre du bas du téléphone), comme DiscussionSortie */
  margeBas: number;
  /** Un message (texte, lieu, photo ou note vocale) vient de partir : l'écran peut suivre la conversation jusqu'en bas */
  onEnvoye: () => void;
  /** Petit message en haut de l'écran (aussi lu par le lecteur d'écran) */
  onAnnoncer: (texte: string) => void;
  reponseA: MessageChatEnrichi | null;
  onAnnulerReponse: () => void;
  edition: MessageChatEnrichi | null;
  onAnnulerEdition: () => void;
};

// Juste après un envoi, le micro prend la place d'« Envoyer » : un double appui réflexe ne lance pas un enregistrement
const DELAI_MICRO_APRES_ENVOI = 700;

/**
 * Le champ d'écriture du chat entre potes, qui reste au-dessus du clavier : « + » pour partager des photos, un lieu, un GIF ou un sondage,
 * le texte, et le rond jaune qui envoie (ou, champ vide, qui enregistre une note vocale).
 */
export function ChampChat({ conversationId, margeBas, onEnvoye, onAnnoncer, reponseA, onAnnulerReponse, edition, onAnnulerEdition }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const T_CHAMP = utiliserTextes(TEXTES_CHAT_CHAMP_PAR_LANGUE);
  const T_APERCUS = utiliserTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE);
  const T_REFUS = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const refus: Record<Exclude<ResultatEnvoiChat, "ok">, string> = {
    vide: T_CHAMP.refusVide,
    "trop-long": T_CHAMP.refusTropLong,
    "mot-interdit": T_CHAMP.refusMotInterdit,
    interdit: T_CHAMP.refusInterdit,
  };
  const refusModification: Record<Exclude<ResultatModificationChat, "ok">, string> = {
    vide: T_CHAMP.modificationVide,
    "trop-long": refus["trop-long"],
    "mot-interdit": refus["mot-interdit"],
    interdit: T_CHAMP.modificationInterdite,
    "trop-tard": T_CHAMP.modificationTropTard,
    "non-modifiable": T_CHAMP.modificationImpossible,
    "compte-limite": T_REFUS.message,
    reseau: T_CHAMP.modificationReseau,
  };
  const microIndisponible = T_CHAMP.microIndisponible;
  const { trouverConversation, envoyerTexte, modifierMessage } = utiliserConversations();
  const { trouverPote, bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const champ = useRef<TextInput>(null);
  const { texte: brouillon, changer: changerBrouillon, vider: viderTexte } = utiliserBrouillonChat(conversationId);
  const [texteEdition, setTexteEdition] = useState(edition?.texte ?? "");
  const [erreur, setErreur] = useState<ProblemeEnregistrement | null>(null);
  const cible = reponseA?.id ?? edition?.id ?? null;
  const [cibleSuivie, setCibleSuivie] = useState(cible);
  if (cible !== cibleSuivie) {
    setCibleSuivie(cible);
    setTexteEdition(edition?.texte ?? "");
    setErreur(null);
  }
  const texte = edition ? texteEdition : brouillon;
  const changerTexte = edition ? setTexteEdition : changerBrouillon;
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistrementPossible] = useState(verifierEnregistrementPossible);
  // Après une note vocale, le lecteur d'écran revient sur le champ (le bouton qu'il lisait a disparu)
  const revenirAuChamp = useRef(false);
  const dernierEnvoi = useRef(0);

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

  useEffect(() => {
    if (!cible) return;
    const minuterie = setTimeout(() => champ.current?.focus(), 80);
    return () => clearTimeout(minuterie);
  }, [cible]);

  const conversation = trouverConversation(conversationId);
  const groupe = conversation?.type === "groupe";
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const aMentionner =
    groupe && conversation
      ? conversation.participants
          .filter((id) => id !== monId && !bloquesIds.has(id))
          .map(trouverPote)
          .filter((p): p is Pote => p !== null && !!p.pseudo)
      : [];
  const mentions = utiliserMentionsChamp(texte, aMentionner, (nouveau) => {
    changerTexte(nouveau);
    if (erreur) setErreur(null);
  });
  const pote = conversation?.type === "prive" ? trouverPote(conversation.participants.find((id) => id !== monId) ?? "") : null;
  const invitation = edition ? T_CHAMP.corrige : pote ? T_CHAMP.ecrireA(pote.prenom) : T_CHAMP.ecrireGroupe;
  const longueur = texte.trim().length;
  const micro = longueur === 0 && !edition;
  const auteurCite = reponseA ? (reponseA.auteur === monId ? null : (trouverPote(reponseA.auteur)?.prenom ?? T_APERCUS.quelquUn)) : null;
  const libelleChamp = edition ? T_CHAMP.champModification : auteurCite ? T_CHAMP.taReponseA(auteurCite) : reponseA ? T_CHAMP.taReponseTonMessage : T_CHAMP.tonMessage;

  function montrerErreur(probleme: ProblemeEnregistrement) {
    setErreur(probleme);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(probleme.texte));
  }

  function apresEnvoi() {
    vibrerLegerement();
    setErreur(null);
    onEnvoye();
  }

  async function enregistrerModification(message: MessageChatEnrichi) {
    if (enregistrementEnCours) return;
    if (texte.trim() === (message.texte ?? "").trim()) return onAnnulerEdition();
    setEnregistrementEnCours(true);
    const resultat = await modifierMessage(conversationId, message.id, texte);
    setEnregistrementEnCours(false);
    if (resultat !== "ok") return montrerErreur({ texte: refusModification[resultat] });
    vibrerLegerement();
    setErreur(null);
    onAnnulerEdition();
    onAnnoncer(T.messageModifie);
  }

  function envoyer() {
    if (edition) return void enregistrerModification(edition);
    const resultat = envoyerTexte(conversationId, texte, reponseA ? { reponseA: reponseA.id } : undefined);
    if (resultat === "ok") {
      dernierEnvoi.current = Date.now();
      viderTexte();
      mentions.oublierSelection();
      if (reponseA) onAnnulerReponse();
      apresEnvoi();
      // « Envoyer » laisse place au micro : le lecteur d'écran revient sur le champ plutôt que de rester sur une autre action
      setTimeout(() => deplacerFocusLecteurEcran(champ.current), 150);
      return;
    }
    montrerErreur({ texte: refus[resultat] });
  }

  function lancerEnregistrement() {
    if (Date.now() - dernierEnvoi.current < DELAI_MICRO_APRES_ENVOI) return;
    if (!enregistrementPossible) return montrerErreur({ texte: microIndisponible });
    Keyboard.dismiss();
    setErreur(null);
    setEnregistrement(true);
  }

  function finirEnregistrement() {
    revenirAuChamp.current = true;
    setEnregistrement(false);
  }

  function ouvrirReglages() {
    Linking.openSettings().catch(() => montrerErreur({ texte: T_CHAMP.reglagesFermes }));
  }

  return (
    <View style={{ paddingBottom: clavierOuvert ? 8 : margeBas + 8 }} className="gap-1.5 border-t border-ligne bg-creme px-4 pt-2">
      {erreur ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text className="font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreur.texte)}</Text>
          {erreur.reglages && Platform.OS !== "web" ? (
            <Pressable accessibilityRole="link" onPress={ouvrirReglages} hitSlop={8} className="min-h-8 justify-center active:opacity-70">
              <Text className="font-texte-gras text-sm text-encre underline">{T_CHAMP.ouvrirReglages}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {mentions.suggestions.length > 0 && !enregistrement ? <SuggestionsMentions potes={mentions.suggestions} onChoisir={mentions.mentionner} /> : null}

      {enregistrement ? null : <BandeauReponseChat reponseA={reponseA} edition={edition} onAnnulerReponse={onAnnulerReponse} onAnnulerEdition={onAnnulerEdition} />}

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
            else onAnnoncer(T_CHAMP.vocalPoubelle);
          }}
        />
      ) : (
        <View className="flex-row items-end gap-2">
          {edition ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T_CHAMP.partager}
              onPress={() => {
                vibrerLegerement();
                // Le clavier resterait par-dessus la feuille et cacherait ses dernières lignes
                Keyboard.dismiss();
                setFeuilleOuverte(true);
              }}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
            >
              <Ionicons name="add" size={26} color={couleurs.encre} />
            </Pressable>
          )}
          <TextInput
            ref={champ}
            accessibilityLabel={`${libelleChamp}${erreur ? `. ${retirerEmojiAnnonce(erreur.texte)}` : ""}`}
            accessibilityHint={groupe ? T_CHAMP.mentionner : undefined}
            value={texte}
            onChangeText={(nouveau) => {
              changerTexte(nouveau);
              if (erreur) setErreur(null);
            }}
            onSelectionChange={mentions.suivreSelection}
            placeholder={invitation}
            placeholderTextColor={couleurs.gris}
            selectionColor={couleurs.encre}
            cursorColor={couleurs.encre}
            multiline
            className={`max-h-32 min-h-11 flex-1 rounded-3xl border-2 bg-carte px-4 py-2.5 font-texte text-base text-encre ${erreur ? "border-rouge-texte" : "border-encre"}`}
          />
          {/* Deux boutons distincts (key) : le lecteur d'écran ne reste pas sur un bouton dont l'action vient de changer */}
          {micro ? (
            <Pressable
              key="micro"
              accessibilityRole="button"
              accessibilityLabel={enregistrementPossible ? T_CHAMP.enregistrerVocal : T_CHAMP.vocalIndisponible}
              accessibilityHint={enregistrementPossible ? T_CHAMP.vocalIndice : retirerEmojiAnnonce(microIndisponible)}
              onPress={lancerEnregistrement}
              className={`h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80 ${enregistrementPossible ? "" : "opacity-40"}`}
            >
              <Ionicons name="mic" size={22} color={couleurs.nuit} />
            </Pressable>
          ) : (
            <Pressable
              key={edition ? "enregistrer" : "envoyer"}
              accessibilityRole="button"
              accessibilityLabel={edition ? T.enregistrerModification : T_CHAMP.envoyer}
              accessibilityState={{ busy: enregistrementEnCours }}
              onPress={envoyer}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
            >
              {enregistrementEnCours ? (
                <ActivityIndicator size="small" color={couleurs.nuit} />
              ) : (
                <Ionicons name={edition ? "checkmark" : "arrow-up"} size={22} color={couleurs.nuit} />
              )}
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
