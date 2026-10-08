import { useRef, useState } from "react";
import { AccessibilityInfo, Platform, ScrollView, Text, View } from "react-native";

import { CarteSuggestion } from "~/composants/suivi/CarteSuggestion";
import type { Suggestion, TypeSuggestion } from "~/contenus/type-suggestion";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuggestionsSuivi } from "~/hooks/utiliser-suggestions-suivi";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  titre: string;
  sousTitre?: string;
  /** Ce qu'on propose, dans cet ordre */
  types: readonly TypeSuggestion[];
  /** 10 par défaut */
  max?: number;
  /** Messages des cartes (Suivre, masquer) ; sans lui, le carrousel les affiche lui-même dessous et les fait lire par VoiceOver */
  onAnnoncer?: (texte: string) => void;
};

// La carte masquée part : VoiceOver va sur sa voisine, une fois l'écran redessiné
const DELAI_FOCUS_APRES_MASQUE = 250;

/**
 * Carrousel « Tu pourrais suivre » (rien du tout s'il n'y a personne à proposer). La liste est figée à l'ouverture : une carte
 * suivie reste là et montre « Suivi » (pour se raviser) ; une carte masquée (✕) part tout de suite, comme une personne bloquée
 * ou signalée entre-temps. Suivre et masquer demandent un compte (en visite, la feuille « Crée ton compte » s'ouvre).
 * Les marges : le carrousel déborde de 20 pt de chaque côté, jusqu'aux bords d'un écran à marges px-5.
 */
export function SuggestionsSuivre({ titre, sousTitre, types, max = 10, onAnnoncer }: Props) {
  const calculees = utiliserSuggestionsSuivi(types, max);
  const { suggestionsMasquees, masquerSuggestion, relationAvec } = utiliserSuivisPersonnes();
  const { estSignale } = utiliserCommunaute();
  const exiger = utiliserCompteRequis();
  const [figees, setFigees] = useState<Suggestion[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const titreRef = useRef<Text>(null);
  const cartes = useRef(new Map<string, View>());

  // Figée dès la première liste non vide (avant, rien n'est relu : la liste est vide)
  if (figees === null && calculees.length > 0) setFigees(calculees);

  const affichees = (figees ?? []).filter((s) => {
    if (suggestionsMasquees.includes(s.cle)) return false;
    if (s.type !== "personne") return true;
    // Bloquée, signalée ou devenue interdite depuis l'ouverture : la carte part (une personne suivie, elle, reste permise)
    const id = s.cle.slice("personne:".length);
    return !estSignale(id) && relationAvec(id)?.verdict.permis === true;
  });

  function annoncer(texte: string) {
    if (onAnnoncer) return onAnnoncer(texte);
    setMessage(texte);
    const lu = retirerEmoji(texte);
    // iOS : l'annonce attend que VoiceOver ait fini sa phrase au lieu de la couper
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(lu, { queue: true });
    else AccessibilityInfo.announceForAccessibility(lu);
  }

  function masquer(suggestion: Suggestion) {
    if (!exiger("suivre")) return;
    const index = affichees.findIndex((s) => s.cle === suggestion.cle);
    const voisine = affichees[index + 1] ?? affichees[index - 1];
    masquerSuggestion(suggestion.cle);
    annoncer(`C'est noté : on ne te proposera plus ${suggestion.nom} 👋`);
    setTimeout(() => deplacerFocusLecteurEcran((voisine && cartes.current.get(voisine.cle)) || titreRef.current), DELAI_FOCUS_APRES_MASQUE);
  }

  if (affichees.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <Text ref={titreRef} accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {titre}
        </Text>
        {sousTitre ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3 px-5 py-1">
        {affichees.map((suggestion) => (
          <CarteSuggestion
            key={suggestion.cle}
            suggestion={suggestion}
            onAnnoncer={annoncer}
            onMasquer={() => masquer(suggestion)}
            refOuvrir={(vue) => {
              if (vue) cartes.current.set(suggestion.cle, vue);
              else cartes.current.delete(suggestion.cle);
            }}
          />
        ))}
      </ScrollView>
      {message ? <Text className="font-texte-moyen text-sm leading-5 text-encre">{lierPonctuation(message)}</Text> : null}
    </View>
  );
}
