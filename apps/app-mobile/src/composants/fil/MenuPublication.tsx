import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignalementPublication, type ChoixSignalement, type EtapeSignalement } from "~/composants/signalement/SignalementPublication";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

/** « signaler » n'arrive au fil qu'en visite sans compte (avec un compte, le signalement se fait dans le menu) */
export type ChoixMenu = "rescousse" | "adresse" | "envoyer" | "pas-interesse" | "signaler";

type Props = {
  visible: boolean;
  nomLieu: string;
  sauve: boolean;
  restantes: number;
  /** Faux en visite sans compte : seule « Voir l'adresse » est libre, le reste mène à « Crée ton compte » (le fil s'en charge) */
  avecCompte: boolean;
  onChoisir: (choix: ChoixMenu) => void;
  /** Signalement envoyé : la feuille reste ouverte pour dire merci */
  onSignaler: (choix: ChoixSignalement) => void;
  onFermer: () => void;
  /**
   * Le menu a fini de se refermer (une fois par fermeture) : c'est le moment d'ouvrir une autre fenêtre (« Crée ton compte »,
   * « Envoyer à un pote »). Plus tôt, iOS refuserait de l'ouvrir pendant que le menu glisse encore.
   */
  onRefermee: () => void;
};

type Vue = "options" | "signalement";

// Seul iOS dit quand le menu a fini de se refermer : ailleurs, on attend la fin de sa glissade
const DUREE_FERMETURE = 450;
// Sur iOS, au cas où la fin de fermeture ne viendrait pas
const SECOURS_IOS = 1000;

/**
 * Le menu « ⋯ » d'une publication, qui monte du bas : rescousse, adresse, envoyer à un pote, pas intéressé, et « Signaler » qui ouvre son propre parcours.
 * En visite sans compte, un cadenas sur tout sauf l'adresse : le fil referme le menu et propose de créer un compte.
 */
export const MenuPublication = memo(function MenuPublication({ visible, nomLieu, sauve, restantes, avecCompte, onChoisir, onSignaler, onFermer, onRefermee }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const defilement = useRef<ScrollView>(null);
  const titreOptions = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
  const [etape, setEtape] = useState<EtapeSignalement>("raison");
  // À chaque ouverture, on repart des options (sans montrer l'ancienne vue le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setVue("options");
      setEtape("raison");
    }
  }

  // Ouvert puis refermé : onRefermee à la fin de la glissade (dite par iOS, sinon attendue), une seule fois
  const aRefermer = useRef(false);
  useEffect(() => {
    if (visible) {
      aRefermer.current = true;
      return;
    }
    if (!aRefermer.current) return;
    const minuterie = setTimeout(finirFermeture, Platform.OS === "ios" ? SECOURS_IOS : DUREE_FERMETURE);
    return () => clearTimeout(minuterie);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finirFermeture ne lit que aRefermer et onRefermee (stable)
  }, [visible]);

  function finirFermeture() {
    if (!aRefermer.current) return;
    aRefermer.current = false;
    onRefermee();
  }

  // Chaque vue ou étape commence en haut de la feuille
  useEffect(() => {
    defilement.current?.scrollTo({ y: 0, animated: false });
  }, [vue, etape]);

  function ouvrirSignalement() {
    setEtape("raison");
    setVue("signalement");
  }

  function revenirAuxOptions() {
    setVue("options");
    // Le lecteur d'écran reprend sur le titre du menu, l'élément qu'il lisait vient de disparaître
    setTimeout(() => deplacerFocusLecteurEcran(titreOptions.current), 150);
  }

  // Retour Android et geste d'échappement de VoiceOver : une étape en arrière, sans perdre ce qui est écrit
  function reculer() {
    if (vue === "signalement" && etape === "details") setEtape("raison");
    else if (vue === "signalement" && etape === "raison") revenirAuxOptions();
    else onFermer();
  }

  // En visite, pas encore de rescousses à compter : on dit seulement ce qui t'attend
  const epuisees = avecCompte && !sauve && restantes <= 0;
  const options: { choix: ChoixMenu; emoji: string; titre: string; detail: string; desactive?: boolean }[] = [
    {
      choix: "rescousse",
      emoji: "🛟",
      titre: avecCompte && sauve ? "Reprendre ma rescousse" : "Donner une rescousse",
      detail: !avecCompte
        ? "Avec ton compte, tu en as à offrir chaque semaine"
        : sauve ? "Elle te sera rendue pour un autre lieu" : epuisees ? "Plus de rescousse cette semaine, reviens lundi !" : `Il t'en reste ${restantes} cette semaine`,
      desactive: epuisees,
    },
    { choix: "adresse", emoji: "📍", titre: "Voir l'adresse", detail: "Horaires, plat signature, itinéraire" },
    { choix: "envoyer", emoji: "💌", titre: "Envoyer à un pote", detail: "Fais-le découvrir à ta bande" },
    { choix: "pas-interesse", emoji: "🙈", titre: "Pas intéressé", detail: "On t'en montrera moins comme ça" },
    { choix: "signaler", emoji: "🚩", titre: "Signaler", detail: "Faux lieu, pub cachée, contenu choquant…" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reculer} onDismiss={finirFermeture}>
      {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi d'un signalement (« padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre) */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Le fond garde au moins la hauteur de la barre d'état : la feuille ne passe jamais dessous */}
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          // flexShrink : clavier ouvert, la feuille rétrécit et son contenu défile jusqu'au bouton d'envoi
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView ref={defilement} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
            {vue === "signalement" ? (
              <SignalementPublication
                nomLieu={nomLieu}
                etape={etape}
                onChangerEtape={setEtape}
                onEnvoyer={onSignaler}
                onRetourMenu={revenirAuxOptions}
                onFermer={onFermer}
              />
            ) : (
              <>
                <Text ref={titreOptions} accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">{nomLieu}</Text>
                {options.map((o) => {
                  // En visite, un petit cadenas sur ce qui demande un compte (tout sauf l'adresse)
                  const verrouille = !avecCompte && o.choix !== "adresse";
                  return (
                    <Pressable
                      key={o.choix}
                      accessibilityRole="button"
                      accessibilityLabel={o.titre}
                      accessibilityState={{ disabled: o.desactive }}
                      accessibilityHint={verrouille ? `${o.detail}. Il te faut un compte, une minute suffit` : o.detail}
                      disabled={o.desactive}
                      onPress={() => {
                        vibrerLegerement();
                        if (o.choix === "signaler" && avecCompte) ouvrirSignalement();
                        else onChoisir(o.choix);
                      }}
                      className={`min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70 ${o.desactive ? "opacity-40" : ""}`}
                    >
                      <Text className="text-2xl">{o.emoji}</Text>
                      <View className="flex-1">
                        <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                        <Text className="font-texte text-sm text-gris">{o.detail}</Text>
                      </View>
                      {verrouille ? (
                        <Ionicons name="lock-closed" size={18} color={couleurs.gris} />
                      ) : o.choix === "signaler" ? (
                        <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                      ) : null}
                    </Pressable>
                  );
                })}
                <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                  <Text className="font-texte-gras text-base text-encre">Annuler</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});
