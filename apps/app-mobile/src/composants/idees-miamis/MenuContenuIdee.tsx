import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PersonneResume } from "@sos-miam/commun/types/social";
import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";

export type ContenuIdeeAuMenu = { type: "idee" | "commentaire"; id: string; auteur: PersonneResume | null; mien: boolean };

type Props = {
  contenu: ContenuIdeeAuMenu | null;
  onSupprimer: () => void;
  onFermer: () => void;
};

type Vue = "options" | "signaler" | "confirmer";
type Choix = { cle: "profil" | "signaler" | "confirmer"; emoji: string; titre: string; detail: string };

const MENU = TEXTES_IDEES.menu;

function lireTitre({ type, auteur, mien }: ContenuIdeeAuMenu): string {
  if (mien) return type === "idee" ? MENU.titreMonIdee : MENU.titreMonCommentaire;
  return type === "commentaire" && auteur ? MENU.titreCommentaire(auteur.pseudo) : MENU.titreIdee;
}

function lireChoix({ type, auteur, mien }: ContenuIdeeAuMenu): Choix[] {
  if (mien) {
    return type === "idee"
      ? [{ cle: "confirmer", emoji: "🧹", titre: MENU.retirerIdee, detail: MENU.retirerIdeeDetail }]
      : [{ cle: "confirmer", emoji: "🗑️", titre: MENU.supprimerCommentaire, detail: MENU.supprimerCommentaireDetail }];
  }
  if (!auteur) return [];
  return [
    { cle: "profil", emoji: "👀", titre: MENU.voirProfil(auteur.pseudo), detail: MENU.voirProfilDetail },
    { cle: "signaler", emoji: "🚩", titre: type === "idee" ? MENU.signalerIdee : MENU.signalerCommentaire, detail: MENU.signalerDetail },
  ];
}

export function MenuContenuIdee({ contenu, onSupprimer, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  utiliserInscriptionFeuille(contenu !== null, onFermer);
  const geste = utiliserGlisserPourFermer(contenu !== null, onFermer);
  const titreVue = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
  const [affiche, setAffiche] = useState<ContenuIdeeAuMenu | null>(contenu);
  if (contenu && contenu !== affiche) setAffiche(contenu);
  const [ouvert, setOuvert] = useState(contenu !== null);
  if ((contenu !== null) !== ouvert) {
    setOuvert(contenu !== null);
    if (contenu) setVue("options");
  }

  useEffect(() => {
    if (!ouvert || vue === "signaler") return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(titreVue.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [ouvert, vue, animationsReduites]);

  if (!affiche) return null;
  const confirmation = affiche.type === "idee" ? MENU.retirerIdeeConfirmation : MENU.supprimerCommentaireConfirmation;
  const reculer = () => (vue === "options" ? onFermer() : setVue("options"));

  function choisir(choix: Choix) {
    vibrerLegerement();
    if (choix.cle !== "profil") return setVue(choix.cle);
    onFermer();
    if (affiche?.auteur) router.push({ pathname: "/potes/profil/[id]", params: { id: affiche.auteur.id } });
  }

  return (
    <Modal visible={contenu !== null} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
              {vue === "signaler" && affiche.auteur ? (
                <SignalerContenu
                  cible={affiche.type === "idee" ? "idee" : "comment-idee"}
                  cibleId={affiche.id}
                  sujet={affiche.type === "idee" ? MENU.sujetSignalementIdee : MENU.sujetSignalementCommentaire(affiche.auteur.pseudo)}
                  onTermine={onFermer}
                />
              ) : vue === "confirmer" ? (
                <View className="gap-3">
                  <Text ref={titreVue} accessibilityRole="header" className="font-titre text-2xl text-encre">
                    {lierPonctuation(confirmation.titre)}
                  </Text>
                  <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(confirmation.detail)}</Text>
                  <Bouton
                    libelle={confirmation.confirmer}
                    variante="encre"
                    onPress={() => {
                      onFermer();
                      onSupprimer();
                    }}
                    className="mt-2"
                  />
                  <Bouton libelle={confirmation.rester} variante="blanc" onPress={() => setVue("options")} />
                </View>
              ) : (
                <>
                  <Text ref={titreVue} accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">
                    {lireTitre(affiche)}
                  </Text>
                  {lireChoix(affiche).map((choix) => (
                    <Pressable
                      key={choix.cle}
                      accessibilityRole="button"
                      accessibilityLabel={choix.titre}
                      accessibilityHint={choix.detail}
                      onPress={() => choisir(choix)}
                      className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                    >
                      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
                        {choix.emoji}
                      </Text>
                      <View className="flex-1">
                        <Text className="font-texte-gras text-base text-encre">{choix.titre}</Text>
                        <Text className="font-texte text-sm text-gris">{choix.detail}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                    </Pressable>
                  ))}
                  <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
                    <Text className="font-texte-gras text-base text-encre">{MENU.annuler}</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
