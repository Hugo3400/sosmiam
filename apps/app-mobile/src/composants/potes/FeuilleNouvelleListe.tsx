import { useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  visible: boolean;
  onFermer: () => void;
  /** Liste créée : son identifiant, pour l'ouvrir */
  onCreee: (id: string) => void;
};

const LONGUEUR_MAX_TITRE = 40;
const LONGUEUR_MAX_DESCRIPTION = 140;
const MOT_INTERDIT = "Ce mot-là, on le laisse au vestiaire : essaie autre chose.";

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

/** Feuille « Nouvelle liste » : un emoji, un nom et, si tu veux, une petite description ; la liste est créée puis ouverte. */
export function FeuilleNouvelleListe({ visible, onFermer, onCreee }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const { creerListe } = utiliserCommunaute();
  const [emoji, setEmoji] = useState(EMOJIS[0].emoji);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [tente, setTente] = useState(false);
  // À chaque ouverture, on repart d'une feuille vierge
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setEmoji(EMOJIS[0].emoji);
      setTitre("");
      setDescription("");
      setTente(false);
    }
  }

  const titrePropre = titre.trim();
  const descriptionPropre = description.trim();
  const erreurTitre = tente && contientMotInterdit(titrePropre) ? MOT_INTERDIT : null;
  const erreurDescription = tente && descriptionPropre !== "" && contientMotInterdit(descriptionPropre) ? MOT_INTERDIT : null;

  function creer() {
    setTente(true);
    if (titrePropre === "" || contientMotInterdit(titrePropre) || (descriptionPropre !== "" && contientMotInterdit(descriptionPropre))) return;
    onCreee(creerListe(titrePropre, emoji, descriptionPropre));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
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
                Nouvelle liste
              </Text>
              <Text className="font-texte text-base leading-6 text-gris">
                {lierPonctuation("Range tes adresses chouchous par envie, et ta bande pourra la suivre.")}
              </Text>
            </View>

            <View className="gap-2">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
                Son emoji
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EMOJIS.map((e, i) => {
                  const choisi = e.emoji === emoji;
                  return (
                    // Choix unique : bouton avec l'état « sélectionné » (VoiceOver lit « checked » en anglais), et la position dans le libellé
                    <Pressable
                      key={e.emoji}
                      accessibilityRole="button"
                      accessibilityLabel={`Emoji ${e.nom}, ${i + 1} sur ${EMOJIS.length}`}
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
              maxLength={LONGUEUR_MAX_TITRE}
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
              maxLength={LONGUEUR_MAX_DESCRIPTION}
              multiline
              autoCapitalize="sentences"
              erreur={erreurDescription}
            />

            <View className="gap-3">
              <Bouton libelle="Créer la liste" desactive={titrePropre === ""} indice="Crée la liste et l'ouvre pour y ajouter des lieux" onPress={creer} />
              <Bouton libelle="Annuler" variante="blanc" onPress={onFermer} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
