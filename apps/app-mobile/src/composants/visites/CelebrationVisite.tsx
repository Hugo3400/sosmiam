import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { TEXTE_VISITE_OFFERTE } from "@sos-miam/commun/contenus/libelles-reglement";
import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { CompteurPoints } from "~/composants/visites/CompteurPoints";
import { ConfettisVisite } from "~/composants/visites/ConfettisVisite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";
import { decrireTamponVisite } from "~/fonctions/visites/decrire-tampon-visite";
import { resumerCelebration } from "~/fonctions/visites/resumer-celebration";
import { utiliserPointsTotaux } from "~/hooks/utiliser-points-totaux";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { estRecompenseVisiteAlcool } from "~/fonctions/visites/est-recompense-visite-alcool";

type Props = {
  resultat: ResultatValidation;
  onFermer: () => void;
};

// Le temps que l'écran finisse d'arriver avant d'y placer le lecteur d'écran
const DELAI_FOCUS_MS = 600;

/** Petite étiquette « Démo », posée de travers sur la carte : une visite de démo reste sur ce téléphone */
function etiquetteDemo(position: string) {
  return (
    <View className={`${position} rotate-6 rounded-full border-2 border-encre bg-encre px-3 py-0.5`}>
      <Text className="font-texte-gras text-xs text-jaune">Démo</Text>
    </View>
  );
}

/**
 * La petite fête d'une visite validée : mascotte, points qui défilent (+25 pendant un SOS), tampon qui se pose, palier
 * franchi, ouverture de l'avis, confettis. Déjà validée : « C'est déjà validé », sans compteur ni confettis.
 * Remplit son parent et défile elle-même (l'écran qui l'affiche garde les marges de sécurité). Le lecteur d'écran est
 * placé sur un seul bloc, qui lit tout d'une traite (resumerCelebration) : l'écran parent n'annonce rien de plus.
 */
export function CelebrationVisite({ resultat, onFermer }: Props) {
  const { visite, dejaValidee } = resultat;
  const fete = !dejaValidee;
  const tampon = decrireTamponVisite(resultat);
  const avis = decrireOuvertureAvis(visite.avis);

  // Palier franchi : les points d'avant la visite et d'après. La liste des visites peut ne pas encore compter celle-ci
  // (elle se relit juste après la validation) : on regarde si elle y est pour ne jamais la retirer ou l'ajouter deux fois
  const pointsTotaux = utiliserPointsTotaux();
  const { visites } = utiliserVisites();
  const dejaComptee = visites.some((v) => v.id === visite.id && v.statut === "validee");
  const avant = dejaComptee ? pointsTotaux - visite.points : pointsTotaux;
  const palierAvant = calculerPalier(avant);
  const palierApres = calculerPalier(avant + visite.points);
  const palier = fete && visite.points > 0 && palierApres.index > palierAvant.index ? palierApres.actuel : null;

  const resume = resumerCelebration(resultat, palier);
  const bloc = useRef<View>(null);

  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(bloc.current), DELAI_FOCUS_MS);
    if (fete && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return () => clearTimeout(minuterie);
  }, [visite.id, fete]);

  const compteur = fete && visite.points > 0;
  const offert = decrireReglement(visite.reglement, "client").offert;

  return (
    <View className="flex-1 bg-creme">
      <ScrollView contentContainerClassName="flex-grow items-center gap-6 px-6 pb-8 pt-6">
        <View ref={bloc} accessible accessibilityLabel={resume} className="w-full items-center gap-5">
          <Mascotte expression={fete ? "miam" : "clin"} taille={128} flotte={fete} />

          <View className="items-center gap-1.5">
            <Text className="text-center font-titre text-4xl text-encre">{lierPonctuation(fete ? "Visite validée !" : "C'est déjà validé")}</Text>
            <Text className="text-center font-texte-semi text-lg text-encre">
              {visite.lieu.emoji} {visite.lieu.nom}
            </Text>
            <Text className="text-center font-texte text-[15px] leading-6 text-gris">
              {lierPonctuation(fete ? LIBELLES_MODE_VALIDATION[visite.mode] : "Tu as tout bon ! Cette visite compte déjà : pas besoin de la scanner deux fois.")}
            </Text>
            {fete ? (
              <View className="mt-2">
                <EtiquettesReglement reglement={visite.reglement} pour="client" centre />
              </View>
            ) : null}
            {visite.demo && !compteur && !tampon ? etiquetteDemo("mt-2") : null}
          </View>

          {fete && offert ? (
            <View className="w-full flex-row items-start gap-3 rounded-carte border-2 border-encre bg-rose-alerte p-4">
              <Text className="text-2xl">🎁</Text>
              <Text className="flex-1 font-texte text-[15px] leading-6 text-encre">{lierPonctuation(TEXTE_VISITE_OFFERTE)}</Text>
            </View>
          ) : null}

          {compteur || tampon ? (
            <View className="w-full gap-4 rounded-carte border-2 border-encre bg-white p-5">
              {visite.demo ? etiquetteDemo("absolute -top-3 right-4") : null}
              {compteur ? <CompteurPoints points={visite.points} sos={visite.pendantSos} /> : null}
              {compteur && visite.pendantSos ? (
                <Text className="text-center font-texte-semi text-[15px] leading-6 text-encre">
                  {lierPonctuation(`+${visite.points} points : ta visite tombe pile pendant leur SOS.`)}
                </Text>
              ) : null}
              {tampon ? (
                <View className={`gap-3 ${compteur ? "border-t-2 border-dashed border-ligne pt-4" : ""}`}>
                  <RangeeTampons tampons={tampon.tampons} sur={tampon.sur} animerDernier={fete} taille="grande" />
                  <Text className="text-center font-texte-semi text-base leading-6 text-encre">{lierPonctuation(tampon.texte)}</Text>
                  {/* Dans le bloc lu d'un seul tenant : le message seul ici, et dans le résumé lu par VoiceOver (resumerCelebration) */}
                  {estRecompenseVisiteAlcool(resultat) ? <MentionPrevention variante="courte" /> : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {palier ? (
            <View className="w-full flex-row items-center gap-3 rounded-carte border-2 border-encre bg-jaune p-4">
              <Text className="text-4xl">{palier.emoji}</Text>
              <View className="flex-1 gap-0.5">
                <Text className="font-titre-gras text-xl text-encre">{lierPonctuation(`Tu passes ${palier.nom} !`)}</Text>
                <Text className="font-texte text-sm leading-5 text-encre">Nouveau palier Ambassadeur : ta ville te dit merci.</Text>
              </View>
            </View>
          ) : null}

          {avis ? (
            <View className="w-full flex-row items-start gap-3 rounded-carte border-2 border-ligne bg-jaune-clair p-4">
              <Text className="text-2xl">✍️</Text>
              <Text className="flex-1 font-texte text-[15px] leading-6 text-encre">{lierPonctuation(avis)}</Text>
            </View>
          ) : null}
        </View>

        <Bouton libelle={fete ? "Trop bien !" : "Parfait"} onPress={onFermer} indice="Ferme cet écran" className="mt-auto self-stretch" />
      </ScrollView>
      {fete ? <ConfettisVisite /> : null}
    </View>
  );
}
