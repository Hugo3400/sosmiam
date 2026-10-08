import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, AppState, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { ChampChat } from "~/composants/chat/ChampChat";
import { EnTeteDiscussion } from "~/composants/chat/EnTeteDiscussion";
import { ListeMessagesChat, type PoigneeListeMessages } from "~/composants/chat/ListeMessagesChat";
import { MenuDiscussion } from "~/composants/chat/MenuDiscussion";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

// Le temps que l'écran suivant s'affiche avant de parler : sinon VoiceOver coupe la phrase pour lire le nouvel écran
const DELAI_ANNONCE_APRES_DEPART = 700;

/**
 * Une conversation du chat entre potes (message privé ou groupe) : en-tête, messages, et le champ en bas qui reste au-dessus du clavier.
 * Conversation disparue (personne bloquée, groupe quitté) : un petit mot et le retour.
 */
export default function EcranDiscussion() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const conversations = utiliserConversations();
  const { pret: communautePrete, trouverPote, bloques } = utiliserCommunaute();
  const liste = useRef<PoigneeListeMessages>(null);
  // Juste après avoir bloqué ou quitté : rien à montrer le temps de revenir à la liste
  const [partie, setPartie] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [aLEcran, setALEcran] = useState(false);
  const [auPremierPlan, setAuPremierPlan] = useState(AppState.currentState !== "background");
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const conversation = conversations.pret ? conversations.trouverConversation(id) : null;
  // Les autres membres qu'on montre : sans toi ni les personnes bloquées
  const membres = useMemo(() => {
    const bloquesIds = new Set(bloques.map((b) => b.id));
    return (conversation?.participants ?? [])
      .filter((p) => p !== ID_MOI && !bloquesIds.has(p))
      .map(trouverPote)
      .filter((p): p is Pote => p !== null);
  }, [conversation?.participants, bloques, trouverPote]);

  // Messages lus : à l'ouverture, au retour dans l'app, et à chaque message qui arrive pendant que tu es là
  useFocusEffect(
    useCallback(() => {
      setALEcran(true);
      return () => setALEcran(false);
    }, []),
  );
  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => setAuPremierPlan(etat === "active"));
    return () => abonnement.remove();
  }, []);
  const marquerSiNonLu = useEffectEvent(() => {
    if (conversation && conversations.nonLusDe(conversation.id) > 0) conversations.marquerLu(conversation.id);
  });
  const dernierMessage = conversation?.messages[conversation.messages.length - 1]?.id ?? "";
  useEffect(() => {
    if (aLEcran && auPremierPlan) marquerSiNonLu();
  }, [aLEcran, auPremierPlan, dernierMessage, conversation?.id]);

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes/messages"));

  /** Bloqué ou quitté : la conversation disparaît, on revient à la liste et le lecteur d'écran le confirme */
  function partir(phrase: string) {
    setPartie(true);
    setMenuOuvert(false);
    router.dismissTo("/potes/messages");
    setTimeout(() => AccessibilityInfo.announceForAccessibility(phrase), DELAI_ANNONCE_APRES_DEPART);
  }

  if (!conversations.pret || !communautePrete || partie) return <View className="flex-1 bg-creme" />;

  if (!conversation) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 48 }} className="items-center gap-4 bg-creme px-8">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
          💨
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          Plus personne au bout du fil
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Cette discussion n'est plus là : tu as peut-être quitté le groupe, ou bloqué la personne. Tes autres potes, eux, t'attendent !")}
        </Text>
        <Bouton libelle="Retour à mes messages" variante="blanc" onPress={retour} />
      </View>
    );
  }

  const groupe = conversation.type === "groupe";
  const poteId = groupe ? null : (conversation.participants.find((p) => p !== ID_MOI) ?? null);
  const pote = poteId ? trouverPote(poteId) : null;
  const ecriturePermise = groupe || (poteId !== null && conversations.peutDiscuterAvec(poteId));
  const mediasPermis = conversations.peutEnvoyerMedias(conversation.id);
  const mineurPresent = conversation.participants.some((p) => trouverPote(p)?.mineur);
  const voirProfil = (qui: string) => {
    setMenuOuvert(false);
    router.push({ pathname: "/potes/profil/[id]", params: { id: qui } });
  };
  // Bloquer l'auteur d'un message : dans un groupe, ses messages disparaissent ; en privé, toute la conversation avec lui
  const apresBlocage = (prenom: string) => {
    if (groupe) annoncer(`🚫 C'est fait : tu ne verras plus les messages de ${prenom}`);
    else partir(`C'est fait : tu as bloqué ${prenom}.`);
  };

  return (
    <View className="flex-1 bg-creme">
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: marges.top }}>
          <EnTeteDiscussion conversation={conversation} membres={membres} onRetour={retour} onOptions={() => setMenuOuvert(true)} onVoirProfil={voirProfil} />

          <ListeMessagesChat ref={liste} conversation={conversation} membres={membres} mediasPermis={mediasPermis} mineurPresent={mineurPresent} onBloque={apresBlocage} />

          {ecriturePermise ? (
            <ChampChat conversationId={conversation.id} margeBas={marges.bottom} onEnvoye={() => liste.current?.allerEnBas()} onAnnoncer={annoncer} />
          ) : (
            <View style={{ paddingBottom: marges.bottom + 12 }} className="gap-2 border-t border-ligne bg-creme px-5 pt-3">
              <Text accessibilityRole="header" accessibilityLabel="Discussion en pause" className="font-texte-gras text-base text-encre">
                🛡️ Discussion en pause
              </Text>
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation(
                  pote
                    ? `Avec les 15-17 ans, on ne discute qu'entre potes ajoutés en vrai, par lien ou QR code. Ajoutez-vous comme ça, ${pote.prenom} et toi, et c'est reparti !`
                    : "Cette personne n'est plus sur SOS Miam : tu peux relire vos messages, mais plus lui en envoyer.",
                )}
              </Text>
              {pote ? <Bouton libelle="Ajouter par lien ou QR code" variante="blanc" petit onPress={() => router.push("/potes/ajouter")} className="mt-1 self-start" /> : null}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <MenuDiscussion
        visible={menuOuvert}
        conversation={conversation}
        membres={membres}
        onFermer={() => setMenuOuvert(false)}
        onVoirProfil={voirProfil}
        onBloque={(prenom) => partir(`C'est fait : tu as bloqué ${prenom}.`)}
        onQuitte={(titre) => partir(`Tu as quitté ${titre}.`)}
      />

      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
