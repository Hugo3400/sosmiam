import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pote } from "@sos-miam/commun/types/potes";
import { ActionsGroupe } from "~/composants/chat/ActionsGroupe";
import { EnTeteInfosGroupe } from "~/composants/chat/EnTeteInfosGroupe";
import { FeuilleInviterGroupe } from "~/composants/chat/FeuilleInviterGroupe";
import { FeuilleRenommerGroupe } from "~/composants/chat/FeuilleRenommerGroupe";
import { MembresGroupe } from "~/composants/chat/MembresGroupe";
import { PartagesGroupe } from "~/composants/chat/PartagesGroupe";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { TEXTES_ECRAN_DISCUSSION_PAR_LANGUE } from "~/contenus/textes-ecran-discussion";
import { TEXTES_INFOS_GROUPE_PAR_LANGUE } from "~/contenus/textes-infos-groupe";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { decrireMembresGroupe } from "~/fonctions/chat/decrire-membres-groupe";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFilDiscussion } from "~/hooks/utiliser-fil-discussion";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { renouvelerPhotoGroupe } from "~/services/photos-groupes-chat";

const OPTIONS_PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 };

export default function EcranInfosGroupe() {
  const T = utiliserTextes(TEXTES_INFOS_GROUPE_PAR_LANGUE);
  const T_MESSAGES = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const T_ECRAN = utiliserTextes(TEXTES_ECRAN_DISCUSSION_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const conversations = utiliserConversations();
  utiliserFilDiscussion(id);
  const { pret: communautePrete, trouverPote, moi, bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [renommer, setRenommer] = useState(false);
  const [inviter, setInviter] = useState(false);
  const [quitter, setQuitter] = useState(false);
  const [photoEnCours, setPhotoEnCours] = useState(false);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  useFocusEffect(
    useCallback(() => {
      if (id) renouvelerPhotoGroupe(id);
    }, [id]),
  );

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes/messages"));
  const conversation = conversations.pret ? conversations.trouverConversation(id) : null;

  if (!conversations.pret || !communautePrete) return <View className="flex-1 bg-creme" />;

  if (!conversation || conversation.type !== "groupe") {
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 48 }} className="items-center gap-4 bg-creme px-8">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
          💨
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.plusLa)}</Text>
        <Bouton libelle={T_ECRAN.retourMessages} variante="blanc" onPress={() => router.replace("/potes/messages")} />
      </View>
    );
  }

  const groupe = conversation;
  const admins = groupe.admins ?? [groupe.creePar];
  const admin = admins.includes(monId);
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const ordre = (p: string) => (p === groupe.creePar ? 0 : p === monId ? 3 : admins.includes(p) ? 1 : 2);
  const membres = groupe.participants
    .filter((p) => !bloquesIds.has(p))
    .sort((a, b) => ordre(a) - ordre(b))
    .flatMap((p) => {
      const pote = p === monId ? moi : trouverPote(p);
      if (!pote) return [];
      return [{ pote, moi: p === monId, role: p === groupe.creePar ? T.organisateur : admins.includes(p) ? T.admin : null }];
    });
  const invites = (groupe.invites ?? []).map(trouverPote).filter((p): p is Pote => p !== null && !bloquesIds.has(p.id));
  const createur = groupe.creePar === monId ? T_ECRAN.creePar : (trouverPote(groupe.creePar)?.prenom ?? null);
  const aUnePhoto = groupe.photo === true || !!groupe.fichierPhoto;
  const epinglee = groupe.epinglee === true;
  const coupee = groupe.coupee === true;
  const repere = groupe.messages[groupe.messages.length - 1]?.id ?? "";
  const prenomDe = (auteur: string) => (auteur === monId ? T.toi : (trouverPote(auteur)?.prenom ?? T_ECRAN.quelquun));

  async function changerPhoto(uri: string | null) {
    setPhotoEnCours(true);
    const resultat = await conversations.changerPhotoGroupe(groupe.id, uri);
    setPhotoEnCours(false);
    if (resultat === "ok") annoncer(uri ? T.photoChangee : T.photoRetiree);
    else annoncer(resultat === "interdit" ? T.reserveAdmins : resultat === "plein" ? T.photoPleine : T.photoRatee);
  }

  async function choisirPhoto() {
    if (photoEnCours) return;
    try {
      const resultat = await ImagePicker.launchImageLibraryAsync(OPTIONS_PHOTO);
      if (resultat.canceled || resultat.assets.length === 0) return;
      await changerPhoto(resultat.assets[0].uri);
    } catch {
      annoncer(T.galerieFermee);
    }
  }

  function basculerEpingle() {
    void conversations.epingler(groupe.id, !epinglee).then((r) => {
      if (r === "plein") annoncer(T_MESSAGES.epinglesPleines);
      else if (r === "reseau") annoncer(T_MESSAGES.epingleRatee);
      else annoncer(epinglee ? T_MESSAGES.desepinglee : T_MESSAGES.epinglee);
    });
  }

  return (
    <View className="flex-1 bg-creme">
      <ScrollView contentContainerStyle={{ paddingTop: marges.top + 8, paddingBottom: marges.bottom + 24 }} contentContainerClassName="gap-5 px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T_ECRAN.retour}
          hitSlop={8}
          onPress={retour}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>

        <EnTeteInfosGroupe
          conversation={groupe}
          admin={admin}
          aUnePhoto={aUnePhoto}
          detail={decrireMembresGroupe(membres.length, createur)}
          photoEnCours={photoEnCours}
          onChangerPhoto={() => void choisirPhoto()}
          onRetirerPhoto={() => void changerPhoto(null)}
          onRenommer={() => setRenommer(true)}
        />

        <ActionsGroupe
          admin={admin}
          epinglee={epinglee}
          coupee={coupee}
          onAjouter={() => setInviter(true)}
          onEpingler={basculerEpingle}
          onCouper={() => {
            conversations.couper(groupe.id, !coupee);
            annoncer(coupee ? T.remises : T.coupees);
          }}
        />

        <MembresGroupe membres={membres} invites={invites} onVoirProfil={(p) => router.push({ pathname: "/potes/profil/[id]", params: { id: p } })} />

        <PartagesGroupe conversationId={groupe.id} repere={repere} prenomDe={prenomDe} />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrerLegerement();
            setQuitter(true);
          }}
          className="min-h-12 justify-center self-start active:opacity-70"
        >
          <Text className="font-texte-gras text-base text-rouge-texte">{T.quitter}</Text>
        </Pressable>
      </ScrollView>

      <FeuilleRenommerGroupe
        visible={renommer}
        conversationId={groupe.id}
        titre={groupe.titre ?? ""}
        emoji={groupe.emoji ?? "💬"}
        onFermer={() => setRenommer(false)}
        onRenomme={(texte) => {
          setRenommer(false);
          annoncer(texte);
        }}
      />
      <FeuilleInviterGroupe
        visible={inviter}
        conversation={groupe}
        onFermer={() => setInviter(false)}
        onInvites={(texte) => {
          setInviter(false);
          annoncer(texte);
        }}
      />
      <FeuilleConfirmation
        visible={quitter}
        emoji="👋"
        titre={T.quitterTitre(groupe.titre?.trim() || null)}
        detail={T.quitterDetail}
        libelleConfirmer={T.quitterOui}
        libelleRester={T.quitterNon}
        onConfirmer={() => {
          conversations.quitterGroupe(groupe.id);
          router.dismissTo("/potes/messages");
        }}
        onFermer={() => setQuitter(false)}
      />
      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
