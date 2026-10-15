import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { CoucheAuDessus } from "~/composants/interface/CoucheAuDessus";
import { TEXTES_LIMITATION } from "~/contenus/limitation-compte";
import { decrireFinLimitation } from "~/fonctions/compte/decrire-fin-limitation";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLecteurEcran } from "~/hooks/utiliser-lecteur-ecran";
import { ecouterCompteLimite } from "~/services/refus-compte-limite";

const CHEMIN_DECISIONS = "/reglages/decisions-moderation";
// Une annonce par minute au plus : plusieurs gestes refusés d'affilée (ou un écran qui réessaie) ne font pas de rafale
const ECART_MIN_MS = 60_000;
// Le temps de lire et d'atteindre « Voir pourquoi » ; plus long avec un lecteur d'écran, qui doit d'abord y aller
const DUREE = 9_000;
const DUREE_LECTEUR_ECRAN = 15_000;
// L'écran qui a écrit dit souvent son propre refus : la phrase passe après lui
const DELAI_LECTURE = 700;

/**
 * L'annonce de toute l'app quand l'API refuse une écriture parce que le compte est limité (403 « compte-limite », vu par
 * le client HTTP de la session) : « Ton compte est limité jusqu'au … : certaines actions sont en pause. », avec « Voir
 * pourquoi » qui ouvre Réglages › Décisions de la modération. Douce, en haut de l'écran, elle s'efface toute seule ; une par
 * minute au plus. Les écrans gardent leurs propres messages. Montée une fois, dans PileRacine.
 */
export function AnnonceCompteLimite() {
  const router = useRouter();
  const chemin = usePathname();
  const marges = useSafeAreaInsets();
  const lecteurEcran = utiliserLecteurEcran();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const derniere = useRef(Number.NEGATIVE_INFINITY);
  // Déjà sur l'écran des décisions : pas de « Voir pourquoi » (relu sans relancer l'annonce quand on change d'écran)
  const surDecisions = chemin === CHEMIN_DECISIONS;
  const surDecisionsActuel = useRef(surDecisions);
  useEffect(() => {
    surDecisionsActuel.current = surDecisions;
  }, [surDecisions]);

  useEffect(
    () =>
      ecouterCompteLimite((jusqua) => {
        const maintenant = Date.now();
        if (maintenant - derniere.current < ECART_MIN_MS) return;
        derniere.current = maintenant;
        const texte = remplirModele(TEXTES_LIMITATION.annonce, { fin: decrireFinLimitation(jusqua) });
        setAnnonce((avant) => ({ texte, numero: (avant?.numero ?? 0) + 1 }));
      }),
    [],
  );

  useEffect(() => {
    if (!annonce) return;
    const lecture = setTimeout(
      () => annoncerLecteurEcran(surDecisionsActuel.current ? annonce.texte : `${annonce.texte} Le pourquoi est dans Réglages, Décisions de la modération.`),
      DELAI_LECTURE,
    );
    const minuterie = setTimeout(() => setAnnonce(null), lecteurEcran ? DUREE_LECTEUR_ECRAN : DUREE);
    return () => {
      clearTimeout(lecture);
      clearTimeout(minuterie);
    };
  }, [annonce, lecteurEcran]);

  if (!annonce) return null;
  return (
    <CoucheAuDessus>
      {/* Position dans style, pas en className : NativeWind ignore className sur un Animated.View qui a un style */}
      <Animated.View
        key={annonce.numero}
        entering={FadeInUp.duration(220)}
        pointerEvents="box-none"
        style={{ position: "absolute", left: 16, right: 16, top: marges.top + 8, zIndex: 1000 }}
      >
        <View pointerEvents="auto" className="flex-row gap-2 rounded-2xl border-2 border-encre bg-jaune-clair py-2.5 pl-3 pr-1">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="pt-0.5 text-lg">
            ⏸️
          </Text>
          <View className="flex-1 items-start gap-1">
            <Text className="font-texte-semi text-[15px] leading-[21px] text-encre">{lierPonctuation(annonce.texte)}</Text>
            {surDecisions ? null : (
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Ouvre les décisions de la modération"
                hitSlop={8}
                onPress={() => {
                  vibrerLegerement();
                  setAnnonce(null);
                  router.push(CHEMIN_DECISIONS);
                }}
                className="min-h-9 justify-center active:opacity-60"
              >
                <Text className="font-texte-gras text-[15px] text-encre underline">Voir pourquoi</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer l'annonce"
            onPress={() => setAnnonce(null)}
            className="min-h-11 min-w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-gras text-base text-encre">
              ✕
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </CoucheAuDessus>
  );
}
