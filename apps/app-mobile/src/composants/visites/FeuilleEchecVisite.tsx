import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Bouton } from "~/composants/interface/Bouton";
import { MessageEchecVisite, type ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";

export type EchecVisite = { erreur: ErreurService; details?: DetailsErreur };

type Props = {
  /** L'échec à expliquer ; null : feuille fermée */
  echec: EchecVisite | null;
  lieuNom?: string;
  /** Boutons au-dessus de « Fermer » ; chacun ferme la feuille, puis agit une fois qu'elle est descendue */
  actions?: ActionEchecVisite[];
  /** Feuille refermée (« Fermer », fond assombri, retour Android, geste d'échappement, ou avant une action) */
  onFermer: () => void;
};

// Seul iOS dit quand la feuille a fini de se refermer : ailleurs, on attend la fin de sa glissade
const DUREE_FERMETURE = 450;

/**
 * Feuille qui monte du bas quand l'addition n'a pas pu partir : le message de MessageEchecVisite, ses boutons
 * (« Réessayer », « Ouvrir les réglages », « Voir ma demande »…) et « Fermer ». Une action attend que la feuille soit
 * descendue avant d'agir (relire la position, ouvrir un autre écran). VoiceOver commence par le titre.
 */
export function FeuilleEchecVisite({ echec, lieuNom, actions = [], onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const refTitre = useRef<Text>(null);
  // Le dernier échec reste affiché pendant que la feuille descend
  const [affiche, setAffiche] = useState<EchecVisite | null>(echec);
  // L'action touchée, lancée une fois la feuille descendue
  const [enFermeture, setEnFermeture] = useState(false);
  const actionEnAttente = useRef<(() => void) | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (echec) {
      setAffiche(echec);
      setEnFermeture(false);
    }
  }, [echec]);

  const visible = echec !== null && !enFermeture;

  useEffect(() => {
    if (!visible) return;
    const attente = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(attente);
  }, [visible, affiche, animationsReduites]);

  useEffect(
    () => () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    },
    [],
  );

  function finirFermeture() {
    const action = actionEnAttente.current;
    if (!action) return;
    actionEnAttente.current = null;
    onFermer();
    action();
  }

  function fermerPuis(action: () => void) {
    if (actionEnAttente.current) return;
    actionEnAttente.current = action;
    setEnFermeture(true);
    if (Platform.OS !== "ios") minuterie.current = setTimeout(finirFermeture, DUREE_FERMETURE);
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer} onDismiss={finirFermeture}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
        className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
      >
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ligne" />
        {/* Avec un très grand texte, le message défile et les boutons restent à l'écran */}
        <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="px-5">
          {affiche ? <MessageEchecVisite erreur={affiche.erreur} details={affiche.details} lieuNom={lieuNom} refTitre={refTitre} /> : null}
        </ScrollView>
        <View className="mt-5 gap-3 px-5">
          {actions.map((action) => (
            <Bouton key={action.libelle} libelle={action.libelle} variante={action.variante ?? "jaune"} onPress={() => fermerPuis(action.onPress)} />
          ))}
          <Bouton libelle="Fermer" variante="blanc" onPress={onFermer} />
        </View>
      </View>
    </Modal>
  );
}
