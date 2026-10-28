import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Visite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { TEXTES_CONTESTATION_VISITE_PAR_LANGUE } from "~/contenus/textes-contestation-visite";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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

/** Comme le serveur : au-delà, le mot serait coupé */
const MOT_MAX = 500;
/** Le compteur n'apparaît qu'à l'approche de la limite */
const COMPTEUR_DES = 400;

/**
 * Feuille « C'est une erreur ? », ouverte depuis une visite refusée (ou annulée par le lieu) : un petit mot facultatif,
 * lu par l'équipe SOS Miam et jamais par le lieu, puis contesterRefus, et « On regarde ça de près. Un humain répondra. ».
 * VoiceOver est posé sur le titre à l'ouverture et une fois envoyée, sur le message en cas d'échec. Animations réduites : en fondu.
 */
export function FeuilleContestation({ visible, visite, onFermer, onContestee }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_CONTESTATION_VISITE_PAR_LANGUE);
  const messages = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const services = utiliserServices();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const refTitre = useRef<Text>(null);
  const refErreur = useRef<View>(null);
  const [etape, setEtape] = useState<Etape>("ecrire");
  const [mot, setMot] = useState("");
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  const monte = useRef(true);
  const geste = utiliserGlisserPourFermer(visible, onFermer);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  // Chaque ouverture repart d'une page blanche (dès le premier rendu : rien de la fois d'avant ne s'affiche)
  const [visibleAvant, setVisibleAvant] = useState(visible);
  if (visible !== visibleAvant) {
    setVisibleAvant(visible);
    if (visible) {
      setEtape("ecrire");
      setMot("");
      setErreur(null);
    }
  }

  // VoiceOver sur le titre à l'arrivée de la feuille et une fois la contestation partie ; sur le message en cas d'échec
  useEffect(() => {
    if (!visible || etape === "envoi") return;
    const cible = erreur ? refErreur.current : refTitre.current;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(cible), animationsReduites ? 150 : 400);
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

  const lieu = visite?.lieu.nom ?? T.lieuInconnu;
  const message = erreur ? messages[erreur] : null;
  const envoyee = etape === "envoyee";
  const enCours = etape === "envoi";

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Le fond garde au moins la hauteur de la barre d'état : la feuille ne passe jamais dessous */}
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermerSansEnvoyer} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.9, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} ecart="grand" />
            <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="gap-4 px-5" keyboardShouldPersistTaps="handled">
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="h-16 w-16 items-center justify-center self-center rounded-full border-2 border-encre bg-jaune">
                <Text className="text-3xl">{envoyee ? "🔎" : "🙋"}</Text>
              </View>
              <View className="gap-2">
                <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
                  {envoyee ? T.titreEnvoyee : lierPonctuation(T.titre)}
                </Text>
                <Text className="text-center font-texte text-base leading-6 text-gris">
                  {lierPonctuation(envoyee ? T.texteEnvoyee : T.texte(lieu))}
                </Text>
              </View>

              {envoyee ? null : (
                <View className="gap-2">
                  <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
                    {T.motTitre} <Text className="font-texte text-gris">{T.motFacultatif}</Text>
                  </Text>
                  <TextInput
                    accessibilityLabel={T.motLu}
                    accessibilityHint={T.motIndice}
                    value={mot}
                    onChangeText={setMot}
                    editable={!enCours}
                    multiline
                    maxLength={MOT_MAX}
                    textAlignVertical="top"
                    placeholder={T.motPlaceholder}
                    placeholderTextColor={couleurs.gris}
                    selectionColor={couleurs.encre}
                    cursorColor={couleurs.encre}
                    className="min-h-[110px] rounded-2xl border-2 border-encre bg-carte px-4 py-3 font-texte text-[17px] leading-6 text-encre"
                  />
                  {mot.length >= COMPTEUR_DES ? (
                    <Text className="self-end font-texte text-[13px] text-gris">
                      {mot.length}/{MOT_MAX}
                    </Text>
                  ) : null}
                </View>
              )}

              {message ? (
                <View ref={refErreur} accessible className="flex-row gap-3 rounded-2xl border-2 border-rouge-texte bg-rose-alerte p-3">
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
                <Bouton libelle={T.fermer} variante="encre" onPress={onFermer} />
              ) : enCours ? (
                // Pas d'état « occupé » (lu en anglais par VoiceOver) : le libellé dit ce qui se passe
                <View
                  accessible
                  accessibilityLabel={T.envoiLu}
                  className="min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-nuit"
                >
                  <ActivityIndicator color={couleurs.jaune} />
                  <Text className="font-texte-gras text-base text-jaune">{T.envoi}</Text>
                </View>
              ) : (
                <Bouton libelle={erreur ? T.reessayer : T.envoyer} variante="encre" indice={T.envoyerIndice} onPress={() => void envoyer()} />
              )}
              {envoyee ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint={T.renoncerIndice}
                  onPress={onFermer}
                  className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
                >
                  <Text className="font-texte-gras text-base text-encre">{T.renoncer}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
