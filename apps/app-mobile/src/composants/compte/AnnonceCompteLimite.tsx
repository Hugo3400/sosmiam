import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, ToastAndroid, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { CoucheAuDessus } from "~/composants/interface/CoucheAuDessus";
import { TEXTES_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_COMPTE_LIMITE_PAR_LANGUE } from "~/contenus/textes-compte-limite";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireFinLimitationLangue } from "~/fonctions/langue/decrire-fin-limitation-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserFeuilleOuverte } from "~/hooks/utiliser-feuille-ouverte";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLecteurEcran } from "~/hooks/utiliser-lecteur-ecran";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { trouverFeuilleOuverte } from "~/services/feuilles-ouvertes";
import { ecouterCompteLimite } from "~/services/refus-compte-limite";

const CHEMIN_DECISIONS = "/reglages/decisions-moderation";
// Une annonce par minute au plus : plusieurs gestes refusés d'affilée (ou un écran qui réessaie) ne font pas de rafale
const ECART_MIN_MS = 60_000;
// Le temps de lire et d'atteindre « Voir pourquoi » ; plus long avec un lecteur d'écran, qui doit d'abord y aller
const DUREE = 9_000;
const DUREE_LECTEUR_ECRAN = 15_000;
// L'écran qui a écrit dit souvent son propre refus : la phrase passe après lui
const DELAI_LECTURE = 700;
// Android : une feuille ouverte (Modal, une autre fenêtre) passe au-dessus de l'annonce, rien n'y peut rien sans module natif
const ANDROID = Platform.OS === "android";

/**
 * L'annonce de toute l'app quand l'API refuse une écriture parce que le compte est limité (403 « compte-limite », vu par
 * le client HTTP de la session) : « Ton compte est limité jusqu'au … : certaines actions sont en pause. », avec « Voir
 * pourquoi » qui ouvre Réglages › Décisions de la modération. Douce, en haut de l'écran, elle s'efface toute seule ; une par
 * minute au plus. Les écrans gardent leurs propres messages. Montée une fois, dans PileRacine.
 * Android, feuille ouverte (inscrite dans services/feuilles-ouvertes) : la feuille recouvre l'annonce. Un toast du système
 * (ToastAndroid, au-dessus des Modal) dit la phrase tout de suite, et l'annonce attend la fermeture de la feuille pour
 * commencer ses secondes : elle est donc vue en entier, avec « Voir pourquoi ». iPhone et web : au-dessus de la feuille.
 */
export function AnnonceCompteLimite() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_COMPTE_LIMITE_PAR_LANGUE);
  const textesLimitation = utiliserTextes(TEXTES_LIMITATION_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const chemin = usePathname();
  const marges = useSafeAreaInsets();
  const lecteurEcran = utiliserLecteurEcran();
  // Android seulement : tant qu'une feuille est ouverte, l'annonce (dessous) attend
  const feuilleOuverte = utiliserFeuilleOuverte();
  const enAttente = ANDROID && feuilleOuverte;
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
        const texte = remplirModele(textesLimitation.annonce, { fin: decrireFinLimitationLangue(jusqua, langue) });
        setAnnonce((avant) => ({ texte, numero: (avant?.numero ?? 0) + 1 }));
        // Le toast passe au-dessus de la feuille ouverte (et TalkBack le lit) ; l'annonce, elle, attend sa fermeture
        if (ANDROID && trouverFeuilleOuverte()) ToastAndroid.show(lierPonctuation(texte), ToastAndroid.LONG);
      }),
    [textesLimitation, langue],
  );

  useEffect(() => {
    if (!annonce || enAttente) return;
    const lecture = setTimeout(
      () => annoncerLecteurEcran(surDecisionsActuel.current ? annonce.texte : `${annonce.texte} ${T.lePourquoi}`),
      DELAI_LECTURE,
    );
    const minuterie = setTimeout(() => setAnnonce(null), lecteurEcran ? DUREE_LECTEUR_ECRAN : DUREE);
    return () => {
      clearTimeout(lecture);
      clearTimeout(minuterie);
    };
  }, [annonce, lecteurEcran, enAttente, T]);

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
                accessibilityHint={T.voirPourquoiIndice}
                hitSlop={8}
                onPress={() => {
                  vibrerLegerement();
                  setAnnonce(null);
                  // Les feuilles ouvertes (commentaires, envoi à un pote, nouvelle liste…) se referment d'abord : sinon la page s'ouvrirait dessous
                  const feuille = trouverFeuilleOuverte();
                  if (feuille) feuille(CHEMIN_DECISIONS);
                  else router.push(CHEMIN_DECISIONS);
                }}
                className="min-h-9 justify-center active:opacity-60"
              >
                <Text className="font-texte-gras text-[15px] text-encre underline">{T.voirPourquoi}</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.fermer}
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
