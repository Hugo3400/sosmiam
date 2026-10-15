import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { ReponseMoment } from "@sos-miam/commun/client-api/contrat-lieu-pro";
import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { Annonce } from "~/composants/interface/Annonce";
import { BlocMessageMoment, type ChampMessage } from "~/composants/pro/BlocMessageMoment";
import { BlocSosDuSoir, type ChampSos } from "~/composants/pro/BlocSosDuSoir";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

// Relu toutes les minutes tant que l'écran est ouvert : un SOS ou un message finit tout seul
const RELECTURE_MS = 60_000;

/**
 * « Ce soir » (gérant et équipe) : le SOS « place ce soir » (un par jour, jusqu'à la fermeture) et le message du moment
 * affiché sur la fiche. Le serveur relit le rôle et les règles à chaque geste ; ses refus s'affichent sous le bon champ.
 */
export default function EcranCeSoir() {
  const { lieuPro } = utiliserModes();
  const { lieuPro: service } = utiliserServices();
  const [moment, setMoment] = useState<MomentLieu | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });

  useFocusEffect(
    useCallback(() => {
      if (!lieuPro) return;
      let actif = true;
      const lire = () => service.lireMoment(lieuPro.id).then((r) => actif && r.ok && setMoment(r.moment));
      void lire();
      const minuterie = setInterval(lire, RELECTURE_MS);
      return () => {
        actif = false;
        clearInterval(minuterie);
      };
    }, [service, lieuPro]),
  );

  if (!lieuPro) return null;
  const id = lieuPro.id;

  /**
   * Un geste : la réponse remplace l'état ; un refus de champ revient à l'appelant, les autres sont annoncés et rendent
   * « refuse » (le bloc garde ce qui était écrit). `refusLimite` : la phrase d'un compte limité, qui ne publie plus pour le lieu
   */
  async function agir<C extends string>(geste: () => Promise<ReponseMoment>, champs: readonly C[], merci: string, refusLimite?: string): Promise<C | "refuse" | null> {
    setEnCours(true);
    const r = await geste();
    setEnCours(false);
    if (r.ok) {
      setMoment(r.moment);
      vibrerLegerement();
      annoncer(merci);
      return null;
    }
    if (r.erreur === "champ-invalide" && champs.includes(r.champ as C)) return r.champ as C;
    annoncer(r.erreur === "compte-limite" && refusLimite ? refusLimite : decrireEchecVisite(r.erreur, r.details, lieuPro?.nom).texte);
    return "refuse";
  }

  return (
    <EcranReglage titre="Ce soir" sousTitre={`${lieuPro.emoji} ${lieuPro.nom} · le SOS du soir et ton message du moment`}>
      {moment === null ? (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      ) : (
        <>
          <SectionReglages titre="SOS du soir">
            <BlocSosDuSoir
              moment={moment}
              enCours={enCours}
              onLancer={(sos) => agir<ChampSos>(() => service.lancerSos(id, sos), ["places", "offre", "jusqua"], "🛟 SOS lancé : les gourmands du coin arrivent !", REFUS_LIMITATION.sosDuSoir)}
              onArreter={() => void agir(() => service.arreterSos(id), [], "SOS arrêté. À demain pour le prochain !")}
            />
          </SectionReglages>
          <SectionReglages titre="Message du moment">
            <BlocMessageMoment
              moment={moment}
              enCours={enCours}
              onAfficher={(message) => agir<ChampMessage>(() => service.reglerMessage(id, message), ["texte", "jusqua"], "📣 Message affiché sur ta fiche", REFUS_LIMITATION.messageMoment)}
              onEffacer={() => void agir(() => service.effacerMessage(id), [], "Message effacé")}
            />
          </SectionReglages>
          <Text className="font-texte text-xs leading-4 text-gris">Ce qui parle d'alcool s'affiche avec le message sanitaire, et jamais en visite sans compte.</Text>
        </>
      )}
      <Annonce annonce={annonce} haut={8} onFin={() => setAnnonce(null)} />
    </EcranReglage>
  );
}
