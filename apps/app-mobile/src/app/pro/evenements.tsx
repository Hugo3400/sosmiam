import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { EVENEMENTS_A_VENIR_MAX } from "@sos-miam/commun/regles/evenements";
import type { EvenementLieuPro } from "@sos-miam/commun/types/evenement";
import { CarteEvenementPro } from "~/composants/pro/CarteEvenementPro";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/**
 * Les événements du lieu (gérant et équipe) : à venir (le plus proche d'abord), puis passés ou annulés depuis 30 jours.
 * Ils s'affichent sur la fiche (« À venir »), dans Explorer, et préviennent les personnes qui suivent le lieu.
 */
export default function EcranEvenementsPro() {
  const router = useRouter();
  const { lieuPro } = utiliserModes();
  const { lieuPro: service } = utiliserServices();
  const [evenements, setEvenements] = useState<EvenementLieuPro[] | null>(null);
  const [echec, setEchec] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!lieuPro) return;
      let actif = true;
      service.listerEvenements(lieuPro.id).then((r) => {
        if (!actif) return;
        if (r.ok) setEvenements(r.evenements);
        else setEchec(decrireEchecVisite(r.erreur, r.details, lieuPro.nom).texte);
      });
      return () => {
        actif = false;
      };
    }, [service, lieuPro]),
  );

  if (!lieuPro) return null;
  const aVenir = evenements?.filter((e) => e.statut === "a-venir") ?? [];
  const finis = evenements?.filter((e) => e.statut !== "a-venir") ?? [];
  const plein = aVenir.length >= EVENEMENTS_A_VENIR_MAX;

  return (
    <EcranReglage
      titre="Événements"
      sousTitre={`${lieuPro.emoji} ${lieuPro.nom}`}
      boutonPrincipal={{
        libelle: "Nouvel événement",
        onPress: () => router.push("/pro/evenement"),
        desactive: plein || evenements === null,
        indice: plein ? `${EVENEMENTS_A_VENIR_MAX} événements à venir au plus : annule ou attends qu'un soit passé` : undefined,
      }}
    >
      {echec ? (
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(echec)}</Text>
      ) : evenements === null ? (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      ) : (
        <>
          <SectionReglages titre="À venir">
            {aVenir.length === 0 ? (
              <Text className="font-texte text-base leading-6 text-gris">
                {lierPonctuation("Rien de prévu pour l'instant. Un concert, un quiz, un atelier ? Les gourmands qui te suivent seront prévenus.")}
              </Text>
            ) : (
              <View className="gap-3">
                {aVenir.map((e) => (
                  <CarteEvenementPro key={e.id} evenement={e} onPress={() => router.push({ pathname: "/pro/evenement", params: { id: String(e.id) } })} />
                ))}
              </View>
            )}
            {plein ? <Text className="mt-3 font-texte text-sm text-gris">{`${EVENEMENTS_A_VENIR_MAX} événements à venir au plus.`}</Text> : null}
          </SectionReglages>
          {finis.length > 0 ? (
            <SectionReglages titre="Passés et annulés">
              <View className="gap-3">
                {finis.map((e) => (
                  <CarteEvenementPro key={e.id} evenement={e} />
                ))}
              </View>
            </SectionReglages>
          ) : null}
        </>
      )}
    </EcranReglage>
  );
}
