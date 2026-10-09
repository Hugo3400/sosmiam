import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

/** Ce qu'un pote a partagé avec toi : un lieu envoyé (identifiant de la recommandation) ou une liste, et ce pote */
export type ContenuPote = { cible: "recommandation" | "liste"; id: string; pote: Pote };

/** Un choix en plus, en tête du menu (« Retirer de « Reçu de tes potes » », « Ne plus suivre cette liste »…) : il agit et ferme */
export type ActionContenuPote = { cle: string; emoji: string; titre: string; detail: string; agir: () => void };

type Props = {
  /** null : menu fermé */
  contenu: ContenuPote | null;
  /** Les choix propres à l'endroit où on est, avant ceux de toujours (profil, signaler, bloquer) */
  actionsEnPlus?: ActionContenuPote[];
  onFermer: () => void;
};

type Vue = "options" | "signaler-contenu" | "signaler-profil" | "bloquer";

// Toujours la même liste vide : une nouvelle à chaque rendu relancerait sans fin la copie des choix affichés
const AUCUNE_ACTION: ActionContenuPote[] = [];

const TEXTES = {
  recommandation: {
    titre: (prenom: string) => `Lieu envoyé par ${prenom}`,
    signaler: "Signaler ce lieu envoyé",
    detail: "Pub déguisée, arnaque, mot qui blesse… il disparaît pour toi",
    sujet: (prenom: string) => `le lieu envoyé par ${prenom}`,
  },
  liste: {
    titre: (prenom: string) => `Liste de ${prenom}`,
    signaler: "Signaler cette liste",
    detail: "Titre choquant, arnaque, pub déguisée… elle disparaît pour toi",
    sujet: (prenom: string) => `la liste de ${prenom}`,
  },
};

/**
 * Le menu « ⋯ » d'un lieu envoyé par un pote ou de sa liste : les choix propres à l'endroit (retirer, ne plus suivre…), puis voir
 * son profil, signaler ce contenu (il disparaît pour toi), signaler son profil, ou le bloquer (tout ce qui vient de lui disparaît
 * alors pour toi). Chaque étape a son retour.
 */
export function MenuContenuPote({ contenu, actionsEnPlus = AUCUNE_ACTION, onFermer }: Props) {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  // Animations réduites demandées sur le téléphone : la feuille apparaît en fondu au lieu de monter
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  const { bloquer, potes, estSignale } = utiliserCommunaute();
  const defilement = useRef<ScrollView>(null);
  const titreOptions = useRef<Text>(null);
  const titreBlocage = useRef<Text>(null);
  const [vue, setVue] = useState<Vue>("options");
  // Déjà signalé en ouvrant le signalement ? Sert à distinguer « retour » (rien d'envoyé) de « Fermer » (après le merci)
  const [dejaSignale, setDejaSignale] = useState(false);
  // Le contenu affiché reste celui de l'ouverture pendant que la feuille redescend (et quand il disparaît après un signalement)
  const [affiche, setAffiche] = useState<ContenuPote | null>(contenu);
  if (contenu && contenu !== affiche) setAffiche(contenu);
  const [actionsAffichees, setActionsAffichees] = useState(actionsEnPlus);
  if (contenu && actionsEnPlus !== actionsAffichees) setActionsAffichees(actionsEnPlus);
  // À chaque ouverture, on repart des options (sans montrer l'ancienne vue le temps d'un rendu)
  const [ouvert, setOuvert] = useState(contenu !== null);
  if ((contenu !== null) !== ouvert) {
    setOuvert(contenu !== null);
    if (contenu) setVue("options");
  }

  // Chaque vue commence en haut de la feuille
  useEffect(() => {
    defilement.current?.scrollTo({ y: 0, animated: false });
  }, [vue]);

  function aller(vers: Vue) {
    if (affiche && vers === "signaler-contenu") setDejaSignale(estSignale(affiche.id));
    if (affiche && vers === "signaler-profil") setDejaSignale(estSignale(affiche.pote.id));
    setVue(vers);
    // Le lecteur d'écran reprend sur le titre de la nouvelle vue (l'élément qu'il lisait vient de disparaître)
    if (vers === "options") setTimeout(() => deplacerFocusLecteurEcran(titreOptions.current), 150);
    if (vers === "bloquer") setTimeout(() => deplacerFocusLecteurEcran(titreBlocage.current), 150);
  }

  // Retour Android et geste d'échappement de VoiceOver : une vue en arrière
  const reculer = () => (vue === "options" ? onFermer() : aller("options"));

  // Fin du signalement : « Fermer » après le merci ferme le menu ; le retour sans rien envoyer ramène aux options
  const terminerSignalement = (cibleId: string) => (!dejaSignale && estSignale(cibleId) ? onFermer() : aller("options"));

  if (!affiche) return null;
  const { pote, cible, id } = affiche;
  const textes = TEXTES[cible];
  const dansBande = potes.some((p) => p.id === pote.id);

  const options = [
    { cle: "profil" as const, emoji: "👀", titre: `Voir le profil de ${pote.prenom}`, detail: `@${pote.pseudo}` },
    { cle: "signaler-contenu" as const, emoji: "🚩", titre: textes.signaler, detail: textes.detail },
    { cle: "signaler-profil" as const, emoji: "🙅", titre: `Signaler ${pote.prenom}`, detail: "Son profil pose problème ? On regarde ça de près" },
    { cle: "bloquer" as const, emoji: "🚫", titre: `Bloquer ${pote.prenom}`, detail: "Ses messages, ses lieux envoyés et ses listes disparaissent pour toi" },
  ];

  return (
    <Modal visible={contenu !== null} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView ref={defilement} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
            {vue === "signaler-contenu" ? (
              <SignalerContenu cible={cible} cibleId={id} sujet={textes.sujet(pote.prenom)} onTermine={() => terminerSignalement(id)} />
            ) : vue === "signaler-profil" ? (
              <SignalerContenu cible="profil" cibleId={pote.id} sujet={`le profil de ${pote.prenom}`} onTermine={() => terminerSignalement(pote.id)} />
            ) : vue === "bloquer" ? (
              <View className="gap-3">
                <Text ref={titreBlocage} accessibilityRole="header" className="font-titre text-2xl text-encre">
                  {lierPonctuation(`Bloquer ${pote.prenom} ?`)}
                </Text>
                <Text className="font-texte text-base leading-6 text-encre">
                  {lierPonctuation(
                    dansBande
                      ? `${pote.prenom} sortira de ta bande, et tu ne verras plus ses messages, ses commentaires, ses lieux envoyés ni ses listes.`
                      : "Tu ne verras plus ses messages, ses commentaires, ses lieux envoyés ni ses listes. Tu restes tranquille, c'est tout ce qui compte.",
                  )}
                </Text>
                <Bouton
                  libelle={`Bloquer ${pote.prenom}`}
                  variante="encre"
                  onPress={() => {
                    bloquer(pote.id);
                    onFermer();
                  }}
                  className="mt-2"
                />
                <Bouton libelle="Non, je reviens" variante="blanc" onPress={() => aller("options")} />
              </View>
            ) : (
              <>
                <Text ref={titreOptions} accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">
                  {textes.titre(pote.prenom)}
                </Text>
                {actionsAffichees.map((a) => (
                  <Pressable
                    key={a.cle}
                    accessibilityRole="button"
                    accessibilityLabel={a.titre}
                    accessibilityHint={a.detail}
                    onPress={() => {
                      vibrerLegerement();
                      onFermer();
                      a.agir();
                    }}
                    className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                  >
                    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
                      {a.emoji}
                    </Text>
                    <View className="flex-1">
                      <Text className="font-texte-gras text-base text-encre">{a.titre}</Text>
                      <Text className="font-texte text-sm text-gris">{a.detail}</Text>
                    </View>
                  </Pressable>
                ))}
                {options.map((o) => (
                  <Pressable
                    key={o.cle}
                    accessibilityRole="button"
                    accessibilityLabel={o.titre}
                    accessibilityHint={o.detail}
                    onPress={() => {
                      vibrerLegerement();
                      if (o.cle === "profil") {
                        onFermer();
                        router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
                      } else aller(o.cle);
                    }}
                    className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                  >
                    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
                      {o.emoji}
                    </Text>
                    <View className="flex-1">
                      <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                      <Text className="font-texte text-sm text-gris">{o.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                  </Pressable>
                ))}
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
}
