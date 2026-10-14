import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { StatistiquesSemaine } from "@sos-miam/commun/types/statistiques-lieu";
import { LigneStatistique } from "~/composants/pro/LigneStatistique";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

type Mesure = "vues" | "rescousses" | "visitesValidees" | "nouveauxClients";

const MESURES: { cle: Mesure; emoji: string; libelle: string }[] = [
  { cle: "vues", emoji: "👀", libelle: "Vues de ta fiche" },
  { cle: "rescousses", emoji: "🛟", libelle: "Rescousses reçues" },
  { cle: "visitesValidees", emoji: "✅", libelle: "Visites validées" },
  { cle: "nouveauxClients", emoji: "🆕", libelle: "Nouveaux clients" },
];

/**
 * Les statistiques du lieu (gérant et équipe) : la semaine en cours (du lundi au dimanche, heure de Paris) comparée à la
 * précédente, et les 8 dernières semaines en petites barres. Les vues sont comptées sans savoir qui (une par jour et par visiteur).
 */
export default function EcranStatistiques() {
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
        else setEchec(decrireEchecVisite(r.erreur, r.details, lieuPro.nom).texte);
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
    <EcranReglage titre="Statistiques" sousTitre={enCours ? `Semaine du ${formaterDateLongue(enCours.debut)}` : `${lieuPro.emoji} ${lieuPro.nom}`}>
      {echec ? (
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(echec)}</Text>
      ) : semaines === null ? (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      ) : !enCours ? (
        <Text className="font-texte text-base leading-6 text-gris">Pas encore de chiffres : ils arrivent avec tes premières visites.</Text>
      ) : (
        <View className="gap-4">
          {MESURES.map((m) => (
            <LigneStatistique key={m.cle} emoji={m.emoji} libelle={m.libelle} valeur={enCours[m.cle]} avant={precedente ? precedente[m.cle] : null} historique={ordre.map((s) => s[m.cle])} />
          ))}
          <Text className="font-texte text-xs leading-4 text-gris">
            {lierPonctuation("Semaines du lundi au dimanche, à l'heure de Paris. Les vues sont comptées sans pister personne : on ne sait jamais qui a regardé.")}
          </Text>
        </View>
      )}
    </EcranReglage>
  );
}
