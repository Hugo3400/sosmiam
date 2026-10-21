import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";

type Props = {
  /** Commentaire dont on ouvre les options (null : menu fermé) */
  commentaire: Commentaire | null;
  /** Prénom de l'auteur, ou nom du lieu */
  nomAuteur: string;
  onModifier: (commentaire: Commentaire) => void;
  onSupprimer: (commentaire: Commentaire) => void;
  onSignaler: (commentaire: Commentaire) => void;
  onBloquer: (commentaire: Commentaire) => void;
  /** Gérant du lieu : masquer le commentaire d'un autre (il part en modération) */
  onMasquer: (commentaire: Commentaire) => void;
  onFermer: () => void;
  /** Tu gères le lieu de la publication : masquer les commentaires des autres, modifier ou supprimer la réponse du lieu */
  gerant: boolean;
};

type Confirmation = "supprimer" | "bloquer" | "masquer" | null;

type Option = { cle: string; emoji: string; titre: string; detail: string; action: () => void };

/**
 * Les options d'un commentaire, posées au-dessus de la feuille des commentaires (pas de deuxième fenêtre, qu'iOS refuserait d'empiler) :
 * « Modifier » et « Supprimer » sur les tiens ; « Signaler » et « Bloquer » sur ceux des autres (pas de blocage pour le lieu).
 * Le gérant du lieu peut en plus masquer ceux des autres, et modifier ou supprimer la réponse du lieu.
 * À la fermeture, la feuille remet le lecteur d'écran là où il était.
 */
export function MenuCommentaire({ commentaire, nomAuteur, onModifier, onSupprimer, onSignaler, onBloquer, onMasquer, onFermer, gerant }: Props) {
  const marges = useSafeAreaInsets();
  const { potes } = utiliserCommunaute();
  const monId = utiliserMonId();
  const titre = useRef<Text>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  // Un autre commentaire : on repart des options
  const idOuvert = commentaire?.id ?? null;
  const geste = utiliserGlisserPourFermer(idOuvert !== null, onFermer, { posee: true });
  const [ouvertSur, setOuvertSur] = useState(idOuvert);
  if (idOuvert !== ouvertSur) {
    setOuvertSur(idOuvert);
    setConfirmation(null);
  }

  // Ce n'est pas une vraie fenêtre : iOS n'y emmène pas VoiceOver tout seul (et la feuille dessous est cachée au lecteur d'écran).
  // On l'y place nous-mêmes, une fois le menu monté
  useEffect(() => {
    if (idOuvert === null) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(titre.current), 250);
    return () => clearTimeout(minuterie);
  }, [idOuvert]);

  if (!commentaire) return null;

  const estMoi = commentaire.auteur === monId;
  const estLieu = commentaire.auteur === "lieu";
  // La réponse du lieu se gère comme un des tiens quand c'est ton lieu
  const aGerer = estMoi || (estLieu && gerant);
  // « Sort de ta bande » seulement pour quelqu'un qui en fait partie : on commente aussi chez des inconnus
  const dansBande = potes.some((p) => p.id === commentaire.auteur);

  function confirmer(choix: Confirmation) {
    setConfirmation(choix);
    setTimeout(() => deplacerFocusLecteurEcran(titre.current), 150);
  }

  function reculer() {
    if (confirmation) confirmer(null);
    else onFermer();
  }

  const masquer: Option = {
    cle: "masquer",
    emoji: "🙈",
    titre: "Masquer (au nom du lieu)",
    detail: "Il disparaît de ta publication et part en modération",
    action: () => confirmer("masquer"),
  };
  const options: Option[] = aGerer
    ? [
        { cle: "modifier", emoji: "✏️", titre: "Modifier", detail: "Une faute, un mot à ajouter ? On corrige", action: () => onModifier(commentaire) },
        { cle: "supprimer", emoji: "🗑️", titre: "Supprimer", detail: "Il disparaîtra de la publication", action: () => confirmer("supprimer") },
      ]
    : [
        ...(gerant && !estLieu ? [masquer] : []),
        { cle: "signaler", emoji: "🚩", titre: "Signaler", detail: "Insulte, arnaque, contenu choquant…", action: () => onSignaler(commentaire) },
        ...(estLieu
          ? []
          : [{ cle: "bloquer", emoji: "🚫", titre: `Bloquer ${nomAuteur}`, detail: "Tu ne verras plus ses commentaires ni ses messages", action: () => confirmer("bloquer") }]),
      ];

  const titres: Record<Exclude<Confirmation, null>, string> = {
    supprimer: estMoi ? "Supprimer ton commentaire ?" : "Supprimer la réponse du lieu ?",
    bloquer: `Bloquer ${nomAuteur} ?`,
    masquer: `Masquer le commentaire de ${nomAuteur} ?`,
  };
  const details: Record<Exclude<Confirmation, null>, string> = {
    supprimer: "Il disparaîtra de la publication, et ses J'aime avec. Pas de retour en arrière possible.",
    bloquer: `${dansBande ? `${nomAuteur} sortira de ta bande, et tu` : "Tu"} ne verras plus ses commentaires ni ses messages. Si tu changes d'avis, ça se passe dans Paramètres, « Personnes bloquées ».`,
    masquer:
      "Il disparaît de ta publication pour tout le monde et part en modération : l'équipe SOS Miam le relit. Son auteur est prévenu, et lui seul le voit encore. Tu pourras annuler juste après.",
  };
  const boutons: Record<Exclude<Confirmation, null>, string> = { supprimer: "Supprimer", bloquer: `Bloquer ${nomAuteur}`, masquer: "Masquer" };
  const titreMenu = confirmation ? titres[confirmation] : estMoi ? "Ton commentaire" : estLieu && gerant ? "La réponse du lieu" : `Commentaire de ${nomAuteur}`;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer les options" onPress={onFermer} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} />
      </Animated.View>
      <Animated.View entering={SlideInDown.duration(220)} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={reculer} onLayout={geste.mesurerFeuille} style={geste.styleFeuille}>
          <View style={{ paddingBottom: marges.bottom + 12 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} className="px-5">
              <Text ref={titre} accessibilityRole="header" numberOfLines={2} className="mb-2 font-titre text-2xl text-encre">
                {titreMenu}
              </Text>
            </PoigneeFeuille>
            <View className="px-5">
              {confirmation ? (
                <View className="gap-3">
                  <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(details[confirmation])}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      vibrerLegerement();
                      if (confirmation === "supprimer") onSupprimer(commentaire);
                      else if (confirmation === "masquer") onMasquer(commentaire);
                      else onBloquer(commentaire);
                    }}
                    className="mt-1 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-rouge-texte active:opacity-80"
                  >
                    <Text className="font-texte-gras text-base text-white">{boutons[confirmation]}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => confirmer(null)} className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                    <Text className="font-texte-gras text-base text-encre">Non, on garde</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {options.map((o) => (
                    <Pressable
                      key={o.cle}
                      accessibilityRole="button"
                      accessibilityLabel={o.titre}
                      accessibilityHint={o.detail}
                      onPress={() => {
                        vibrerLegerement();
                        o.action();
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
                    </Pressable>
                  ))}
                  <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                    <Text className="font-texte-gras text-base text-encre">Annuler</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
