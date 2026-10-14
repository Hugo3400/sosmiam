import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { MissionAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import { TYPES_MISSION } from "~/composants/ambassadeur/CarteMission";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

const COMPTE_RENDU_MIN = 5;
const COMPTE_RENDU_MAX = 2000;

/** Une mission : ce qu'il faut faire, où et avant quand, puis « J'ai fini la mission » avec un petit compte rendu pour l'équipe. */
export default function EcranMission() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ambassadeur } = utiliserServices();
  const [mission, setMission] = useState<MissionAmbassadeur | null | undefined>(undefined);
  const [compteRendu, setCompteRendu] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  useEffect(() => {
    ambassadeur.listerMissions().then((r) => setMission(r.ok ? (r.missions.find((m) => String(m.id) === id) ?? null) : null));
  }, [ambassadeur, id]);

  if (mission === undefined) {
    return (
      <EcranReglage titre="Mission">
        <ActivityIndicator color={couleurs.encre} />
      </EcranReglage>
    );
  }
  if (mission === null) {
    return (
      <EcranReglage titre="Mission introuvable" sousTitre="Elle a peut-être été annulée par l'équipe.">
        <Bouton libelle="Retour" variante="blanc" onPress={() => router.back()} />
      </EcranReglage>
    );
  }

  const type = TYPES_MISSION[mission.type];
  const aFaire = mission.statut === "a-faire";
  async function terminer() {
    if (!mission) return;
    setEnCours(true);
    const r = await ambassadeur.terminerMission(mission.id, compteRendu.trim());
    setEnCours(false);
    if (!r.ok) return setAnnonce({ texte: decrireEchecVisite(r.erreur, r.details).texte, numero: Date.now() });
    vibrerLegerement();
    setMission(r.mission);
    setAnnonce({ texte: "🎉 Mission accomplie ! Merci, l'équipe lit ton compte rendu.", numero: Date.now() });
  }

  return (
    <EcranReglage
      titre={mission.titre}
      sousTitre={`${type.emoji} ${type.nom}${mission.echeance && aFaire ? ` · avant le ${ecrireJourLong(mission.echeance).toLowerCase()}` : ""}`}
      boutonPrincipal={
        aFaire
          ? { libelle: enCours ? "Un instant…" : "J'ai fini la mission", onPress: () => void terminer(), desactive: enCours || compteRendu.trim().length < COMPTE_RENDU_MIN }
          : undefined
      }
    >
      <View className="gap-5">
        {mission.detail ? <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(mission.detail)}</Text> : null}
        {mission.lieu ? (
          <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
            <Text className="font-texte-gras text-base text-encre">{`${mission.lieu.emoji} ${mission.lieu.nom}`}</Text>
            <Text className="font-texte text-sm text-gris">{mission.lieu.ville}</Text>
            <Bouton libelle="Voir la fiche du lieu" variante="blanc" petit onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(mission.lieu!.id) } })} />
          </View>
        ) : null}
        {aFaire ? (
          <ChampTexte
            libelle="Ton compte rendu"
            valeur={compteRendu}
            onChangeTexte={setCompteRendu}
            multiline
            maxLength={COMPTE_RENDU_MAX}
            placeholder="Ce que tu as vu sur place, en quelques mots"
            aide={`${COMPTE_RENDU_MIN} caractères au moins · relu par l'équipe seulement`}
          />
        ) : (
          <View className="gap-2 rounded-carte border-2 border-encre bg-creme p-4">
            <Text className="font-texte-gras text-base text-encre">{mission.statut === "annulee" ? "Mission annulée par l'équipe" : `✅ Faite le ${mission.faiteLe ? ecrireJourLong(mission.faiteLe).toLowerCase() : ""}`}</Text>
            {mission.compteRendu ? <Text className="font-texte text-[15px] leading-[21px] text-encre">{mission.compteRendu}</Text> : null}
          </View>
        )}
      </View>
      <Annonce annonce={annonce} haut={8} onFin={() => setAnnonce(null)} />
    </EcranReglage>
  );
}
