import * as Crypto from "expo-crypto";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { LONGUEUR_MAX_DESCRIPTION_LISTE, LONGUEUR_MAX_TITRE_LISTE } from "@sos-miam/commun/regles/listes";
import type { VisibiliteListe } from "@sos-miam/commun/types/listes";
import type { ListePartagee } from "@sos-miam/commun/types/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { ChoixVisibiliteListe } from "~/composants/potes/ChoixVisibiliteListe";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_LISTES_PARTAGEES_PAR_LANGUE } from "~/contenus/textes-listes-partagees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type ErreurNouvelleListe } from "~/hooks/utiliser-communaute";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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

// Le nom lu à la place de chaque emoji est au même rang dans le dictionnaire (nomsEmojis)
const EMOJIS = ["📋", "🍕", "🍜", "🥐", "☀️", "🌙", "🎂", "🪙", "💘", "🌱"];

/**
 * Feuille « Nouvelle liste » : un emoji, un nom, si tu veux une petite description, et qui la voit (tout le monde ou ta bande) ;
 * la liste est créée puis ouverte. Avec `liste`, la même feuille sert à la modifier (seuls les champs changés partent).
 */
export function FeuilleNouvelleListe({ visible, onFermer, onCreee, liste = null, onModifiee }: Props) {
  const marges = useSafeAreaInsets();
  const T = utiliserTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE);
  const R = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const erreursCreation: Readonly<Record<ErreurNouvelleListe, string>> = { ...T.feuille.erreurs, "compte-limite": R.liste };
  utiliserInscriptionFeuille(visible, onFermer);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  // Animations réduites demandées sur le téléphone : la feuille apparaît en fondu au lieu de monter
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  const { creerListe, modifierListe } = utiliserCommunaute();
  const [emoji, setEmoji] = useState(liste?.emoji ?? EMOJIS[0]);
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
      setEmoji(liste?.emoji ?? EMOJIS[0]);
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
  const proposes = EMOJIS.map((e, i) => ({ emoji: e, nom: T.feuille.nomsEmojis[i] ?? "" }));
  const emojis = liste && !EMOJIS.includes(liste.emoji) ? [{ emoji: liste.emoji, nom: T.feuille.actuel }, ...proposes] : proposes;

  const titrePropre = titre.trim();
  const descriptionPropre = description.trim();
  const erreurTitre = tente && contientMotInterdit(titrePropre) ? T.feuille.motInterdit : null;
  const erreurDescription = tente && descriptionPropre !== "" && contientMotInterdit(descriptionPropre) ? T.feuille.motInterdit : null;

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
      if (erreur) return montrerSouci(erreur === "compte-limite" ? R.liste : messagesService[erreur].texte);
      return onModifiee?.();
    }
    setEnvoi(true);
    const resultat = await creerListe({ titre: titrePropre, emoji, description: descriptionPropre, visibilite }, cle);
    setEnvoi(false);
    if ("erreur" in resultat) return montrerSouci(erreursCreation[resultat.erreur]);
    onCreee?.(resultat.id);
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={T.feuille.fermer} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.9, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-2">
              <View className="gap-1">
                <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
                  {liste ? T.feuille.titreModifier : T.feuille.titreNouvelle}
                </Text>
                <Text className="font-texte text-base leading-6 text-gris">
                  {lierPonctuation(liste ? T.feuille.texteModifier : T.feuille.texteNouvelle)}
                </Text>
              </View>

              <View className="gap-2">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
                  {T.feuille.sonEmoji}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {emojis.map((e, i) => {
                    const choisi = e.emoji === emoji;
                    return (
                      // Choix unique : bouton avec l'état « sélectionné » (VoiceOver lit « checked » en anglais), et la position dans le libellé
                      <Pressable
                        key={e.emoji}
                        accessibilityRole="button"
                        accessibilityLabel={T.feuille.emojiLu(e.nom, T.position(i + 1, emojis.length))}
                        accessibilityState={{ selected: choisi }}
                        onPress={() => {
                          vibrerLegerement();
                          setEmoji(e.emoji);
                        }}
                        className={`h-12 w-12 items-center justify-center rounded-full border-2 active:opacity-70 ${choisi ? "border-encre bg-jaune" : "border-ligne bg-carte"}`}
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
                libelle={T.feuille.sonNom}
                valeur={titre}
                onChangeTexte={setTitre}
                placeholder={T.feuille.exempleNom}
                maxLength={LONGUEUR_MAX_TITRE_LISTE}
                autoCapitalize="sentences"
                returnKeyType="next"
                erreur={erreurTitre}
              />
              <ChampTexte
                libelle={T.feuille.description}
                mention={T.feuille.facultatif}
                valeur={description}
                onChangeTexte={setDescription}
                placeholder={T.feuille.exempleDescription}
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
                  libelle={envoi ? T.feuille.unInstant : liste ? T.feuille.enregistrer : T.feuille.creer}
                  desactive={titrePropre === "" || envoi}
                  indice={liste ? T.feuille.indiceEnregistrer : T.feuille.indiceCreer}
                  onPress={() => void valider()}
                />
                <Bouton libelle={T.feuille.annuler} variante="blanc" onPress={onFermer} />
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
