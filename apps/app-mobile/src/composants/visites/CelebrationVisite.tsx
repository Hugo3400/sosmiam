import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { TEXTE_VISITE_OFFERTE_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-reglement";
import { LIBELLES_MODE_VALIDATION_PAR_LANGUE } from "@sos-miam/commun/contenus/modes-validation";
import { NOMS_PALIERS_PAR_LANGUE } from "@sos-miam/commun/contenus/noms-paliers";
import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { CompteurPoints } from "~/composants/visites/CompteurPoints";
import { ConfettisVisite } from "~/composants/visites/ConfettisVisite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { TEXTES_VISITE_PAR_LANGUE } from "~/contenus/textes-visite";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { decrireReglementLangue } from "~/fonctions/langue/decrire-reglement-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";
import { decrireTamponVisite } from "~/fonctions/visites/decrire-tampon-visite";
import { resumerCelebration } from "~/fonctions/visites/resumer-celebration";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserPointsTotaux } from "~/hooks/utiliser-points-totaux";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import { utiliserSession } from "~/hooks/utiliser-session";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { estRecompenseVisiteAlcool } from "~/fonctions/visites/est-recompense-visite-alcool";

type Props = {
  resultat: ResultatValidation;
  onFermer: () => void;
};

// Le temps que l'écran finisse d'arriver avant d'y placer le lecteur d'écran
const DELAI_FOCUS_MS = 600;

/**
 * La petite fête d'une visite validée : mascotte, points qui défilent (+25 pendant un SOS), tampon qui se pose, palier
 * franchi, ouverture de l'avis, confettis. Déjà validée : « C'est déjà validé », sans compteur ni confettis.
 * Remplit son parent et défile elle-même (l'écran qui l'affiche garde les marges de sécurité). Le lecteur d'écran est
 * placé sur un seul bloc, qui lit tout d'une traite (resumerCelebration) : l'écran parent n'annonce rien de plus.
 */
export function CelebrationVisite({ resultat, onFermer }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_VISITE_PAR_LANGUE);
  const modes = utiliserTextes(LIBELLES_MODE_VALIDATION_PAR_LANGUE);
  const nomsPaliers = utiliserTextes(NOMS_PALIERS_PAR_LANGUE);
  const texteVisiteOfferte = utiliserTextes(TEXTE_VISITE_OFFERTE_PAR_LANGUE);
  const { visite, dejaValidee } = resultat;
  const fete = !dejaValidee;
  const tampon = decrireTamponVisite(resultat, langue);
  const avis = decrireOuvertureAvis(visite.avis, langue);

  // Palier franchi : les points d'avant la visite et d'après. La liste des visites peut ne pas encore compter celle-ci
  // (elle se relit juste après la validation) : on regarde si elle y est pour ne jamais la retirer ou l'ajouter deux fois
  const pointsTotaux = utiliserPointsTotaux();
  const { visites } = utiliserVisites();
  const dejaComptee = visites.some((v) => v.id === visite.id && v.statut === "validee");
  const avantCalcule = dejaComptee ? pointsTotaux - visite.points : pointsTotaux;
  // Figés dès que tes points sont connus (le compte relu) : les relectures qui suivent la fête ne changent plus le palier
  const { compte } = utiliserSession();
  const pointsConnus = compte !== null;
  const [avantFige, setAvantFige] = useState<number | null>(null);
  if (avantFige === null && pointsConnus) setAvantFige(avantCalcule);
  const avant = avantFige ?? avantCalcule;
  const palierAvant = calculerPalier(avant);
  const palierApres = calculerPalier(avant + visite.points);
  const palier = fete && pointsConnus && visite.points > 0 && palierApres.index > palierAvant.index ? palierApres.actuel : null;

  const resume = resumerCelebration(resultat, palier, langue);
  const bloc = useRef<View>(null);

  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(bloc.current), DELAI_FOCUS_MS);
    if (fete && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return () => clearTimeout(minuterie);
  }, [visite.id, fete]);

  const compteur = fete && visite.points > 0;
  const offert = decrireReglementLangue(visite.reglement, "client", langue).offert;

  return (
    <View className="flex-1 bg-creme">
      <ScrollView contentContainerClassName="flex-grow items-center gap-6 px-6 pb-8 pt-6">
        <View ref={bloc} accessible accessibilityLabel={resume} className="w-full items-center gap-5">
          <Mascotte expression={fete ? "miam" : "clin"} taille={128} flotte={fete} />

          <View className="items-center gap-1.5">
            <Text className="text-center font-titre text-4xl text-encre">{lierPonctuation(fete ? T.valideeTitre : T.dejaTitre)}</Text>
            <Text className="text-center font-texte-semi text-lg text-encre">
              {visite.lieu.emoji} {visite.lieu.nom}
            </Text>
            <Text className="text-center font-texte text-[15px] leading-6 text-gris">
              {lierPonctuation(fete ? modes[visite.mode] : T.dejaTexte)}
            </Text>
            {fete ? (
              <View className="mt-2">
                <EtiquettesReglement reglement={visite.reglement} pour="client" centre />
              </View>
            ) : null}
          </View>

          {fete && offert ? (
            <View className="w-full flex-row items-start gap-3 rounded-carte border-2 border-encre bg-rose-alerte p-4">
              <Text className="text-2xl">🎁</Text>
              <Text className="flex-1 font-texte text-[15px] leading-6 text-encre">{lierPonctuation(texteVisiteOfferte)}</Text>
            </View>
          ) : null}

          {compteur || tampon ? (
            <View className="w-full gap-4 rounded-carte border-2 border-encre bg-carte p-5">
              {compteur ? <CompteurPoints points={visite.points} sos={visite.pendantSos} /> : null}
              {compteur && visite.pendantSos ? (
                <Text className="text-center font-texte-semi text-[15px] leading-6 text-encre">
                  {lierPonctuation(T.pointsSos(visite.points))}
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
                <Text className="font-titre-gras text-xl text-nuit">{lierPonctuation(T.palierTitre(nomsPaliers[palier.cle]))}</Text>
                <Text className="font-texte text-sm leading-5 text-nuit">{T.palierTexte}</Text>
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

        <Bouton libelle={fete ? T.feteBouton : T.dejaBouton} onPress={onFermer} indice={T.fermerIndice} className="mt-auto self-stretch" />
      </ScrollView>
      {fete ? <ConfettisVisite /> : null}
    </View>
  );
}
