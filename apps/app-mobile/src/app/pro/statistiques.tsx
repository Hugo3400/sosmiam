import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { StatistiquesSemaine } from "@sos-miam/commun/types/statistiques-lieu";
import { LigneStatistique } from "~/composants/pro/LigneStatistique";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_ECRAN_STATISTIQUES_PAR_LANGUE } from "~/contenus/textes-ecran-pro-mon-lieu";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Mesure = "vues" | "rescousses" | "visitesValidees" | "nouveauxClients";

const MESURES: { cle: Mesure; emoji: string }[] = [
  { cle: "vues", emoji: "👀" },
  { cle: "rescousses", emoji: "🛟" },
  { cle: "visitesValidees", emoji: "✅" },
  { cle: "nouveauxClients", emoji: "🆕" },
];

/**
 * Les statistiques du lieu (gérant et équipe) : la semaine en cours (du lundi au dimanche, heure de Paris) comparée à la
 * précédente, et les 8 dernières semaines en petites barres. Les vues sont comptées sans savoir qui (une par jour et par visiteur).
 */
export default function EcranStatistiques() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ECRAN_STATISTIQUES_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { lieuPro } = utiliserModes();
  const { lieuPro: service } = utiliserServices();
  const [semaines, setSemaines] = useState<StatistiquesSemaine[] | null>(null);
  const [echec, setEchec] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!lieuPro) return;
      let actif = true;
      service.lireStatistiques(lieuPro.id).then((r) => {
        if (!actif) return;
        if (r.ok) setSemaines(r.semaines);
        else setEchec(decrireEchecVisite(r.erreur, langue, r.details, lieuPro.nom).texte);
      });
      return () => {
        actif = false;
      };
    }, [service, lieuPro]),
  );

  if (!lieuPro) return null;
  const enCours = semaines?.[0] ?? null;
  const precedente = semaines?.[1] ?? null;
  const ordre = semaines ? [...semaines].reverse() : [];

  return (
    <EcranReglage titre={T.titre} sousTitre={enCours ? T.semaine(ecrireDateLongueLangue(enCours.debut, langue)) : `${lieuPro.emoji} ${lieuPro.nom}`}>
      {echec ? (
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(echec)}</Text>
      ) : semaines === null ? (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      ) : !enCours ? (
        <Text className="font-texte text-base leading-6 text-gris">{T.vide}</Text>
      ) : (
        <View className="gap-4">
          {MESURES.map((m) => (
            <LigneStatistique key={m.cle} emoji={m.emoji} libelle={T.mesures[m.cle]} valeur={enCours[m.cle]} avant={precedente ? precedente[m.cle] : null} historique={ordre.map((s) => s[m.cle])} />
          ))}
          <Text className="font-texte text-xs leading-4 text-gris">
            {lierPonctuation(T.note)}
          </Text>
        </View>
      )}
    </EcranReglage>
  );
}
