import * as Crypto from "expo-crypto";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { LONGUEUR_MAX_DESCRIPTION_LISTE, LONGUEUR_MAX_TITRE_LISTE, MAX_LISTES_PAR_COMPTE } from "@sos-miam/commun/regles/listes";
import type { VisibiliteListe } from "@sos-miam/commun/types/listes";
import type { ListePartagee } from "@sos-miam/commun/types/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ChoixVisibiliteListe } from "~/composants/potes/ChoixVisibiliteListe";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type ErreurNouvelleListe } from "~/hooks/utiliser-communaute";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";

type Props = {
  visible: boolean;
  onFermer: () => void;
  /** Liste créée : son identifiant, pour l'ouvrir */
  onCreee?: (id: string) => void;
  /** Mode modification : la liste de l'auteur, dont la feuille reprend le nom, l'emoji, la description et qui la voit */
  liste?: ListePartagee | null;
  /** Mode modification : c'est enregistré (ou rien n'a changé) */
  onModifiee?: () => void;
};

const MOT_INTERDIT = "Ce mot-là, on le laisse au vestiaire : essaie autre chose.";
const ERREURS_CREATION: Record<ErreurNouvelleListe, string> = {
  titre: `Ce nom ne passe pas : ${LONGUEUR_MAX_TITRE_LISTE} caractères au plus, et des mots gentils.`,
  description: `Cette description ne passe pas : ${LONGUEUR_MAX_DESCRIPTION_LISTE} caractères au plus, et des mots gentils.`,
  trop: `${MAX_LISTES_PAR_COMPTE} listes, c'est le maximum. Fusionne ou supprime celles qui dorment, et la suivante aura sa place.`,
  "compte-limite": REFUS_LIMITATION.liste,
  reseau: "Le réseau a fait des siennes : ta liste n'est pas partie. Réessaie dans un instant.",
};

// « nom » : ce que le lecteur d'écran dit à la place de l'emoji
const EMOJIS = [
  { emoji: "📋", nom: "Carnet" },
  { emoji: "🍕", nom: "Pizza" },
  { emoji: "🍜", nom: "Ramen" },
  { emoji: "🥐", nom: "Croissant" },
  { emoji: "☀️", nom: "Soleil" },
  { emoji: "🌙", nom: "Lune" },
  { emoji: "🎂", nom: "Gâteau" },
  { emoji: "🪙", nom: "Petit budget" },
  { emoji: "💘", nom: "Cœur" },
  { emoji: "🌱", nom: "Végé" },
];

/**
 * Feuille « Nouvelle liste » : un emoji, un nom, si tu veux une petite description, et qui la voit (tout le monde ou ta bande) ;
 * la liste est créée puis ouverte. Avec `liste`, la même feuille sert à la modifier (seuls les champs changés partent).
 */
export function FeuilleNouvelleListe({ visible, onFermer, onCreee, liste = null, onModifiee }: Props) {
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  // Animations réduites demandées sur le téléphone : la feuille apparaît en fondu au lieu de monter
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  const { creerListe, modifierListe } = utiliserCommunaute();
  const [emoji, setEmoji] = useState(liste?.emoji ?? EMOJIS[0].emoji);
  const [titre, setTitre] = useState(liste?.titre ?? "");
  const [description, setDescription] = useState(liste?.description ?? "");
  const [visibilite, setVisibilite] = useState<VisibiliteListe>(liste?.visibilite ?? "tous");
  const [tente, setTente] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [souci, setSouci] = useState<string | null>(null);
  // Tirée à chaque ouverture : un second appui (ou un nouvel essai après une coupure) ne crée pas deux listes
  const [cle, setCle] = useState(() => Crypto.randomUUID());
  // À chaque ouverture, on repart d'une feuille vierge (ou de la liste à modifier)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setEmoji(liste?.emoji ?? EMOJIS[0].emoji);
      setTitre(liste?.titre ?? "");
      setDescription(liste?.description ?? "");
      setVisibilite(liste?.visibilite ?? "tous");
      setTente(false);
      setEnvoi(false);
      setSouci(null);
      setCle(Crypto.randomUUID());
    }
  }
  // L'emoji d'une liste à modifier reste proposé, même s'il n'est pas dans les choix de départ
  const emojis = liste && !EMOJIS.some((e) => e.emoji === liste.emoji) ? [{ emoji: liste.emoji, nom: "Actuel" }, ...EMOJIS] : EMOJIS;

  const titrePropre = titre.trim();
  const descriptionPropre = description.trim();
  const erreurTitre = tente && contientMotInterdit(titrePropre) ? MOT_INTERDIT : null;
  const erreurDescription = tente && descriptionPropre !== "" && contientMotInterdit(descriptionPropre) ? MOT_INTERDIT : null;

  function montrerSouci(texte: string) {
    setSouci(texte);
    AccessibilityInfo.announceForAccessibility(texte);
  }

  async function valider() {
    setTente(true);
    if (envoi || titrePropre === "" || contientMotInterdit(titrePropre) || (descriptionPropre !== "" && contientMotInterdit(descriptionPropre))) return;
    setSouci(null);
    if (liste) {
      const changements = {
        ...(titrePropre !== liste.titre ? { titre: titrePropre } : {}),
        ...(emoji !== liste.emoji ? { emoji } : {}),
        ...(descriptionPropre !== liste.description ? { description: descriptionPropre } : {}),
        ...(visibilite !== (liste.visibilite ?? "tous") ? { visibilite } : {}),
      };
      if (Object.keys(changements).length === 0) return onModifiee?.();
      setEnvoi(true);
      const erreur = await modifierListe(liste.id, changements);
      setEnvoi(false);
      if (erreur) return montrerSouci(erreur === "compte-limite" ? REFUS_LIMITATION.liste : MESSAGES_SERVICE[erreur].texte);
      return onModifiee?.();
    }
    setEnvoi(true);
    const resultat = await creerListe({ titre: titrePropre, emoji, description: descriptionPropre, visibilite }, cle);
    setEnvoi(false);
    if ("erreur" in resultat) return montrerSouci(ERREURS_CREATION[resultat.erreur]);
    onCreee?.(resultat.id);
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.9, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-2">
            <View className="gap-1">
              <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
                {liste ? "Modifier la liste" : "Nouvelle liste"}
              </Text>
              <Text className="font-texte text-base leading-6 text-gris">
                {lierPonctuation(liste ? "Un nouveau nom, un autre emoji ? Les adresses, elles, restent bien au chaud." : "Range tes adresses chouchous par envie, et ta bande pourra la suivre.")}
              </Text>
            </View>

            <View className="gap-2">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
                Son emoji
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {emojis.map((e, i) => {
                  const choisi = e.emoji === emoji;
                  return (
                    // Choix unique : bouton avec l'état « sélectionné » (VoiceOver lit « checked » en anglais), et la position dans le libellé
                    <Pressable
                      key={e.emoji}
                      accessibilityRole="button"
                      accessibilityLabel={`Emoji ${e.nom}, ${i + 1} sur ${emojis.length}`}
                      accessibilityState={{ selected: choisi }}
                      onPress={() => {
                        vibrerLegerement();
                        setEmoji(e.emoji);
                      }}
                      className={`h-12 w-12 items-center justify-center rounded-full border-2 active:opacity-70 ${choisi ? "border-encre bg-jaune" : "border-ligne bg-white"}`}
                    >
                      <Text allowFontScaling={false} className="text-2xl">
                        {e.emoji}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ChampTexte
              libelle="Son nom"
              valeur={titre}
              onChangeTexte={setTitre}
              placeholder="Brunchs du dimanche"
              maxLength={LONGUEUR_MAX_TITRE_LISTE}
              autoCapitalize="sentences"
              returnKeyType="next"
              erreur={erreurTitre}
            />
            <ChampTexte
              libelle="Une petite description"
              mention="facultatif"
              valeur={description}
              onChangeTexte={setDescription}
              placeholder="Pour quoi, pour qui, pour quand ?"
              maxLength={LONGUEUR_MAX_DESCRIPTION_LISTE}
              multiline
              autoCapitalize="sentences"
              erreur={erreurDescription}
            />

            <ChoixVisibiliteListe choisie={visibilite} onChoisir={setVisibilite} />

            <View className="gap-3">
              {souci ? (
                <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
              ) : null}
              <Bouton
                libelle={envoi ? "Un instant…" : liste ? "Enregistrer" : "Créer la liste"}
                desactive={titrePropre === "" || envoi}
                indice={liste ? "Enregistre tes changements" : "Crée la liste et l'ouvre pour y ajouter des lieux"}
                onPress={() => void valider()}
              />
              <Bouton libelle="Annuler" variante="blanc" onPress={onFermer} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
