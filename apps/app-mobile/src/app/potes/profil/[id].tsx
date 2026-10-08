import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { CodeQrInvitation } from "~/composants/potes/CodeQrInvitation";
import { ProfilCommunautaire } from "~/composants/potes/ProfilCommunautaire";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

/** Demande confirmation avant une action qui compte ; sur le web (aperçu de développement), Alert n'existe pas : on agit directement */
const confirmer = (titre: string, message: string, action: string, faire: () => void) => {
  if (Platform.OS === "web") return faire();
  Alert.alert(titre, message, [
    { text: "Annuler", style: "cancel" },
    { text: action, style: "destructive", onPress: faire },
  ]);
};

/**
 * Le profil communautaire d'un pote, ou le tien (id « moi »). Pour toi : « Partager mon profil » (lien et QR code).
 * Pour quelqu'un d'autre : l'ajouter, le retirer de ta bande, le bloquer (avec confirmation) ou le signaler.
 * Personne bloquée ou inconnue : un message et le retour.
 */
export default function ProfilPote() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const communaute = utiliserCommunaute();
  const [signalementOuvert, setSignalementOuvert] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pote = communaute.trouverPote(id);
  const estMoi = id === ID_MOI;
  const bloque = communaute.bloques.some((p) => p.id === id);
  const dansBande = communaute.potes.some((p) => p.id === id);
  // Un mineur hors de ta bande, vu par un adulte : seulement son avatar, son prénom et son pseudo (il s'ajoute par lien ou QR code)
  const reserve = !estMoi && !dansBande && !!pote?.mineur && !communaute.moiMineur;

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const annoncer = (texte: string) => {
    setMessage(texte);
    AccessibilityInfo.announceForAccessibility(texte);
  };

  if (!pote) {
    return (
      <EcranReglage titre="Personne à l'horizon" sousTitre="On ne trouve pas ce profil : la personne a peut-être quitté SOS Miam, ou le lien s'est emmêlé.">
        <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  if (bloque) {
    return (
      <EcranReglage titre={`Tu as bloqué ${pote.prenom}`} sousTitre="Cette personne n'est plus dans ta bande, et tu ne vois plus ses messages ni ses commentaires.">
        <View className="gap-4">
          <Bouton libelle="Retour" onPress={revenir} />
          <Bouton
            libelle="Débloquer"
            variante="blanc"
            indice={`Tu reverras ses messages et ses commentaires ; ${pote.prenom} ne revient pas dans ta bande pour autant`}
            onPress={() =>
              confirmer(`Débloquer ${pote.prenom} ?`, "Tu reverras ses messages et ses commentaires. Pour l'avoir dans ta bande, il faudra l'ajouter à nouveau.", "Débloquer", () =>
                communaute.debloquer(pote.id),
              )
            }
          />
        </View>
      </EcranReglage>
    );
  }

  const prenom = pote.prenom;
  // Un adulte ne peut pas ajouter un mineur depuis un profil : seulement par son lien ou son QR code
  const ajoutable = !estMoi && !dansBande && !reserve;

  const ajouter = () => {
    const resultat = communaute.ajouterPote(pote.id, "pseudo");
    annoncer(
      resultat === "ajoute" || resultat === "deja"
        ? `${prenom} fait partie de ta bande !`
        : resultat === "mineur"
          ? "Pour ajouter cette personne, demande-lui son lien ou son QR code."
          : "Impossible de l'ajouter pour l'instant. Réessaie dans un instant ?",
    );
  };

  const retirer = () =>
    confirmer(
      `Retirer ${prenom} de ta bande ?`,
      pote.mineur && !communaute.moiMineur ? "Pour l'y remettre, il te faudra son lien ou son QR code." : "Pas de drame : tu pourras l'y remettre quand tu veux.",
      "Retirer",
      () => {
        communaute.retirerPote(pote.id);
        annoncer(`${prenom} ne fait plus partie de ta bande.`);
      },
    );

  const bloquer = () =>
    confirmer(`Bloquer ${prenom} ?`, `${prenom} sortira de ta bande, et tu ne verras plus ses messages ni ses commentaires.`, "Bloquer", () =>
      communaute.bloquer(pote.id),
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">
        {estMoi ? null : (
          <View className="flex-row items-center gap-2 rounded-2xl bg-jaune-clair px-4 py-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
              🧪
            </Text>
            <Text className="flex-1 font-texte-semi text-sm leading-5 text-encre">{lierPonctuation("Potes d'exemple : tes vrais potes arriveront avec les comptes.")}</Text>
          </View>
        )}

        <ProfilCommunautaire pote={pote} estMoi={estMoi} reserve={reserve} />

        {reserve ? (
          <View className="gap-1 rounded-2xl border-2 border-ligne bg-white px-4 py-4">
            <Text className="font-texte-gras text-base text-encre">🔐 Profil réservé à sa bande</Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Pour ajouter cette personne, demande-lui son lien ou son QR code.")}</Text>
          </View>
        ) : null}

        {estMoi ? (
          <SectionReglages titre="Partager mon profil">
            <View className="gap-3 pt-1">
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Ton QR code et ton lien : tes potes t'ajoutent avec, sans chercher ton pseudo.")}</Text>
              <CodeQrInvitation pseudo={pote.pseudo} libellePartage="Partager mon profil" />
            </View>
          </SectionReglages>
        ) : (
          <View>
            {ajoutable ? <Bouton libelle={`Ajouter ${prenom} à ma bande`} indice="Pour organiser des sorties et vous envoyer des lieux" onPress={ajouter} className="mb-4" /> : null}
            {message ? (
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="mb-4 text-center font-texte-semi text-sm text-encre">
                {lierPonctuation(message)}
              </Text>
            ) : null}
            {dansBande ? <LigneReglage emoji="👋" titre="Retirer de ma bande" detail="Vous restez potes dans la vraie vie, hein" onPress={retirer} /> : null}
            <LigneReglage emoji="🚫" titre="Bloquer" detail="Plus de messages ni de commentaires de sa part" danger onPress={bloquer} />
            <LigneReglage emoji="🚩" titre="Signaler" detail="Faux profil, harcèlement, contenu gênant…" onPress={() => setSignalementOuvert(true)} />
          </View>
        )}
      </ScrollView>

      <Modal visible={signalementOuvert} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={() => setSignalementOuvert(false)}>
        {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi du signalement */}
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => setSignalementOuvert(false)} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={() => setSignalementOuvert(false)}
            style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
            className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
          >
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
              <SignalerContenu cible="profil" cibleId={pote.id} sujet={`le profil de ${prenom}`} onTermine={() => setSignalementOuvert(false)} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
