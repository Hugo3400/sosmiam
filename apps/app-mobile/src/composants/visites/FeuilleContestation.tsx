import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Visite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  /** La visite refusée (ou dont la validation a été annulée par le lieu) ; null tant qu'aucune n'est choisie */
  visite: Pick<Visite, "id" | "lieu"> | null;
  /** « Finalement non », « Fermer », fond assombri, retour Android ou geste d'échappement de VoiceOver */
  onFermer: () => void;
  /** La contestation est bien partie : la visite à jour (marquée contestée) */
  onContestee?: (visite: Visite) => void;
};

type Etape = "ecrire" | "envoi" | "envoyee";

/** Comme le serveur de démo : au-delà, le mot serait coupé */
const MOT_MAX = 500;
/** Le compteur n'apparaît qu'à l'approche de la limite */
const COMPTEUR_DES = 400;

/**
 * Feuille « C'est une erreur ? », ouverte depuis une visite refusée (ou annulée par le lieu) : un petit mot facultatif,
 * lu par l'équipe SOS Miam et jamais par le lieu, puis contesterRefus, et « On regarde ça de près. Un humain répondra. ».
 * VoiceOver est posé sur le titre à l'ouverture et à chaque changement (envoyée, échec). Animations réduites : en fondu.
 */
export function FeuilleContestation({ visible, visite, onFermer, onContestee }: Props) {
  const services = utiliserServices();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const refTitre = useRef<Text>(null);
  const [etape, setEtape] = useState<Etape>("ecrire");
  const [mot, setMot] = useState("");
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  const monte = useRef(true);

  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  // Chaque ouverture repart d'une page blanche
  useEffect(() => {
    if (!visible) return;
    setEtape("ecrire");
    setMot("");
    setErreur(null);
  }, [visible]);

  // VoiceOver sur le titre : à l'arrivée de la feuille, puis quand le message change (envoyée, échec)
  useEffect(() => {
    if (!visible || etape === "envoi") return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, etape, erreur, animationsReduites]);

  async function envoyer() {
    if (!visite || etape === "envoi") return;
    setEtape("envoi");
    setErreur(null);
    let reponse: Awaited<ReturnType<typeof services.visites.contesterRefus>>;
    try {
      reponse = await services.visites.contesterRefus(visite.id, mot.trim());
    } catch {
      reponse = { ok: false, erreur: "hors-ligne" };
    }
    if (!monte.current) return;
    if (reponse.ok) {
      setEtape("envoyee");
      onContestee?.(reponse.visite);
    } else {
      setErreur(reponse.erreur);
      setEtape("ecrire");
    }
  }

  const lieu = visite?.lieu.nom ?? "le lieu";
  const message = erreur ? MESSAGES_SERVICE[erreur] : null;
  const envoyee = etape === "envoyee";
  const enCours = etape === "envoi";

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Le fond garde au moins la hauteur de la barre d'état : la feuille ne passe jamais dessous */}
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer, sans rien envoyer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.9, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="gap-4 px-5" keyboardShouldPersistTaps="handled">
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="h-16 w-16 items-center justify-center self-center rounded-full border-2 border-encre bg-jaune">
              <Text className="text-3xl">{envoyee ? "🔎" : "🙋"}</Text>
            </View>
            <View className="gap-2">
              <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
                {envoyee ? "On regarde ça de près" : lierPonctuation("Une erreur, tu crois ?")}
              </Text>
              <Text className="text-center font-texte text-base leading-6 text-gris">
                {lierPonctuation(
                  envoyee
                    ? "Un humain répondra. Merci de nous l'avoir dit !"
                    : `Si tu as bien payé chez ${lieu}, dis-le-nous. C'est l'équipe SOS Miam qui lit ton mot, jamais le lieu.`,
                )}
              </Text>
            </View>

            {envoyee ? null : (
              <View className="gap-2">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
                  Ton petit mot <Text className="font-texte text-gris">(facultatif)</Text>
                </Text>
                <TextInput
                  accessibilityLabel="Ton petit mot, facultatif"
                  accessibilityHint="Ce qui s'est passé, en quelques mots. 500 caractères au plus."
                  value={mot}
                  onChangeText={setMot}
                  editable={!enCours}
                  multiline
                  maxLength={MOT_MAX}
                  textAlignVertical="top"
                  placeholder="Ex. : j'ai payé vers 20 h, en terrasse, avec ma sœur."
                  placeholderTextColor={couleurs.gris}
                  selectionColor={couleurs.encre}
                  cursorColor={couleurs.encre}
                  className="min-h-[110px] rounded-2xl border-2 border-encre bg-white px-4 py-3 font-texte text-[17px] leading-6 text-encre"
                />
                {mot.length >= COMPTEUR_DES ? (
                  <Text className="self-end font-texte text-[13px] text-gris">
                    {mot.length}/{MOT_MAX}
                  </Text>
                ) : null}
              </View>
            )}

            {message ? (
              <View accessible className="flex-row gap-3 rounded-2xl border-2 border-rouge-texte bg-rose-alerte p-3">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
                  {message.emoji}
                </Text>
                <View className="flex-1 gap-0.5">
                  <Text className="font-texte-gras text-[15px] text-encre">{lierPonctuation(remplirModele(message.titre, { lieu }))}</Text>
                  <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(remplirModele(message.texte, { lieu }))}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View className="mt-5 gap-3 px-5">
            {envoyee ? (
              <Bouton libelle="Fermer" variante="encre" onPress={onFermer} />
            ) : enCours ? (
              // Pas d'état « occupé » (lu en anglais par VoiceOver) : le libellé dit ce qui se passe
              <View
                accessible
                accessibilityLabel="Envoi en cours"
                className="min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-encre"
              >
                <ActivityIndicator color={couleurs.jaune} />
                <Text className="font-texte-gras text-base text-jaune">On envoie…</Text>
              </View>
            ) : (
              <Bouton libelle={erreur ? "Réessayer" : "Envoyer"} variante="encre" indice="L'équipe SOS Miam reçoit ta contestation" onPress={() => void envoyer()} />
            )}
            {envoyee ? null : (
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Rien n'est envoyé"
                onPress={onFermer}
                className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
              >
                <Text className="font-texte-gras text-base text-encre">Finalement non</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
