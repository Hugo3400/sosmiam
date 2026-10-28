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
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRAN_CE_SOIR_PAR_LANGUE } from "~/contenus/textes-ecran-pro-mon-lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

// Relu toutes les minutes tant que l'écran est ouvert : un SOS ou un message finit tout seul
const RELECTURE_MS = 60_000;

/** Où dire un refus « compte limité » : au-dessus du bouton du geste refusé (lancer ou arrêter le SOS, afficher ou effacer le message) */
type BlocRefuse = "sos" | "arreter" | "message" | "effacer";

/**
 * « Ce soir » (gérant et équipe) : le SOS « place ce soir » (un par jour, jusqu'à la fermeture) et le message du moment
 * affiché sur la fiche. Le serveur relit le rôle et les règles à chaque geste ; ses refus s'affichent sous le bon champ.
 */
export default function EcranCeSoir() {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_ECRAN_CE_SOIR_PAR_LANGUE);
  const TL = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { lieuPro } = utiliserModes();
  const { lieuPro: service } = utiliserServices();
  const [moment, setMoment] = useState<MomentLieu | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  // Compte limité : la phrase reste au-dessus du bouton du geste refusé (lancer ou arrêter le SOS, afficher ou effacer le
  // message), jusqu'au prochain geste
  const [refusLimite, setRefusLimite] = useState<{ bloc: BlocRefuse; texte: string } | null>(null);

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
   * Un geste : la réponse remplace l'état ; un refus de champ revient à l'appelant, les autres rendent « refuse » (le bloc
   * garde ce qui était écrit) et sont annoncés. `siLimite` : un compte limité ne publie plus pour le lieu, la phrase va au bloc
   */
  async function agir<C extends string>(
    geste: () => Promise<ReponseMoment>,
    champs: readonly C[],
    merci: string,
    siLimite?: { bloc: BlocRefuse; texte: string },
  ): Promise<C | "refuse" | null> {
    setEnCours(true);
    setRefusLimite(null);
    const r = await geste();
    setEnCours(false);
    if (r.ok) {
      setMoment(r.moment);
      vibrerLegerement();
      annoncer(merci);
      return null;
    }
    if (r.erreur === "champ-invalide" && champs.includes(r.champ as C)) return r.champ as C;
    if (r.erreur === "compte-limite" && siLimite) setRefusLimite(siLimite);
    else annoncer(decrireEchecVisite(r.erreur, langue, r.details, lieuPro?.nom).texte);
    return "refuse";
  }
  const refusDe = (bloc: BlocRefuse) => (refusLimite?.bloc === bloc ? refusLimite.texte : null);

  return (
    <EcranReglage titre={T.titre} sousTitre={`${lieuPro.emoji} ${lieuPro.nom} · ${T.sousTitre}`}>
      {moment === null ? (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      ) : (
        <>
          <SectionReglages titre={T.sos}>
            <BlocSosDuSoir
              moment={moment}
              enCours={enCours}
              refusLimite={refusDe("sos")}
              refusArreter={refusDe("arreter")}
              onLancer={(sos) => agir<ChampSos>(() => service.lancerSos(id, sos), ["places", "offre", "jusqua"], T.sosLance, { bloc: "sos", texte: TL.sosDuSoir })}
              onArreter={() => void agir(() => service.arreterSos(id), [], T.sosArrete, { bloc: "arreter", texte: TL.arreterSos })}
            />
          </SectionReglages>
          <SectionReglages titre={T.message}>
            <BlocMessageMoment
              moment={moment}
              enCours={enCours}
              refusLimite={refusDe("message")}
              refusEffacer={refusDe("effacer")}
              onAfficher={(message) => agir<ChampMessage>(() => service.reglerMessage(id, message), ["texte", "jusqua"], T.messageAffiche, { bloc: "message", texte: TL.messageMoment })}
              onEffacer={() => void agir(() => service.effacerMessage(id), [], T.messageEfface, { bloc: "effacer", texte: TL.effacerMessage })}
            />
          </SectionReglages>
          <Text className="font-texte text-xs leading-4 text-gris">{T.alcool}</Text>
        </>
      )}
      <Annonce annonce={annonce} haut={8} onFin={() => setAnnonce(null)} />
    </EcranReglage>
  );
}
