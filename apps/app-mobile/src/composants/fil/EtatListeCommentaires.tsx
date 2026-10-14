import { useEffect, useState, type Ref } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** « chargement » : première lecture ; « ratee » : la lecture n'est pas arrivée ; « vide » : aucun commentaire */
  etat: "chargement" | "ratee" | "vide";
  /** Lecture ratée au-dessus d'une liste déjà là (une relecture n'est pas passée) : une ligne, pas toute la place */
  compact?: boolean;
  onReessayer: () => void;
  /** « Écrire un commentaire » de la liste vide */
  onEcrire: () => void;
  /** Ce bouton « Écrire un commentaire » (le lecteur d'écran y revient après « Crée ton compte ») */
  ref?: Ref<View>;
};

// La relecture ne dit pas quand elle a fini : la roue tourne au plus ce temps-là, puis le message revient si rien n'est arrivé
const DUREE_RELANCE = 3000;

/** Ce que montre la feuille des commentaires quand la liste est vide : la lecture en cours, une lecture ratée, ou « Sois le premier ». */
export function EtatListeCommentaires({ etat, compact = false, onReessayer, onEcrire, ref }: Props) {
  // « Réessayer » touché : la roue tourne le temps que la liste arrive
  const [relance, setRelance] = useState(false);
  useEffect(() => {
    if (!relance) return;
    const minuterie = setTimeout(() => setRelance(false), DUREE_RELANCE);
    return () => clearTimeout(minuterie);
  }, [relance]);

  const reessayer = () => {
    setRelance(true);
    onReessayer();
  };

  if (etat === "ratee" && compact) {
    return (
      <View accessibilityLiveRegion="polite" className="mb-1 flex-row items-center gap-2 rounded-2xl border-2 border-dashed border-gris/60 py-1 pl-3 pr-1">
        <Text className="flex-1 font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation("📡 Pas pu rafraîchir les commentaires : tu vois ceux d'avant.")}</Text>
        {relance ? (
          <ActivityIndicator size="small" color={couleurs.gris} accessibilityLabel="On retente" style={{ marginHorizontal: 16 }} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
            onPress={() => {
              vibrerLegerement();
              reessayer();
            }}
            className="min-h-11 justify-center px-3 active:opacity-60"
          >
            <Text className="font-texte-gras text-[13px] text-encre">Réessayer</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (etat === "chargement" || relance) {
    return (
      <View accessible accessibilityLabel="Les commentaires arrivent" className="flex-1 items-center justify-center gap-3 px-4 py-8">
        <ActivityIndicator size="large" color={couleurs.encre} />
        <Text className="text-center font-texte text-sm text-gris">{relance ? "On retente…" : "On sert les commentaires…"}</Text>
      </View>
    );
  }

  const ratee = etat === "ratee";
  return (
    <View accessibilityLiveRegion="polite" className="flex-1 items-center justify-center gap-2 px-4 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        {ratee ? "📡" : "💬"}
      </Text>
      <Text accessibilityRole="header" className="text-center font-titre text-xl text-encre">
        {ratee ? "Les commentaires sont restés en cuisine" : "Sois le premier à commenter"}
      </Text>
      <Text className="text-center font-texte text-sm leading-5 text-gris">
        {lierPonctuation(
          ratee
            ? "La connexion fait des siennes, rien de grave. Vérifie ton réseau, et on retente ?"
            : "Un mot gentil, une question sur le plat, une envie d'y filer ce soir : lance la conversation !",
        )}
      </Text>
      {ratee ? (
        <Bouton libelle="Réessayer" variante="blanc" petit indice="Relit les commentaires de la publication" onPress={reessayer} className="mt-2" />
      ) : (
        <Bouton ref={ref} libelle="Écrire un commentaire" variante="blanc" petit onPress={onEcrire} className="mt-2" />
      )}
    </View>
  );
}
