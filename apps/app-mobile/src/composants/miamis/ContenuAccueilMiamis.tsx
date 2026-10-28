import { useState } from "react";
import { View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { CarteQuiEstLaAccueil } from "~/composants/miamis/CarteQuiEstLaAccueil";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { FeuilleMesEnvies } from "~/composants/miamis/FeuilleMesEnvies";
import { SectionFilMiamis } from "~/composants/miamis/SectionFilMiamis";
import { SectionSortiesMiamis } from "~/composants/miamis/SectionSortiesMiamis";
import { REFUS_LIMITATION_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import { utiliserAccueilMiamis } from "~/hooks/utiliser-accueil-miamis";
import { utiliserMesEnviesMiamis } from "~/hooks/utiliser-mes-envies-miamis";
import { utiliserProfilVisibiliteMiamis } from "~/hooks/utiliser-profil-visibilite-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function ContenuAccueilMiamis() {
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_MIAMIS_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const decrireRefus = (erreur: ErreurService) => (erreur === "compte-limite" ? refusLimitation.venir : messagesService[erreur].texte);
  const accueil = utiliserAccueilMiamis();
  const { envies, modifier: modifierEnvies } = utiliserMesEnviesMiamis();
  const { genre, genreLu } = utiliserProfilVisibiliteMiamis();
  const [feuilleEnvies, setFeuilleEnvies] = useState(false);
  const [refus, setRefus] = useState<{ texte: string; limite: boolean } | null>(null);
  const { sorties, quiEstLa, fil } = accueil;

  if (sorties.erreur && !sorties.donnees) {
    return (
      <View className="px-5">
        <ErreurMiamis erreur={sorties.erreur} onReessayer={() => void accueil.relireTout()} />
      </View>
    );
  }

  async function demander(id: string) {
    setRefus(null);
    const erreur = await accueil.demanderAVenir(id);
    if (erreur) setRefus({ texte: decrireRefus(erreur), limite: erreur === "compte-limite" });
  }

  return (
    <View className="gap-8">
      {quiEstLa.donnees?.ville ? (
        <View className="px-5">
          <CarteQuiEstLaAccueil ville={quiEstLa.donnees.ville} total={quiEstLa.donnees.total} presents={quiEstLa.donnees.presents} />
        </View>
      ) : null}
      <SectionSortiesMiamis
        sorties={sorties.donnees?.sorties ?? null}
        chargement={sorties.chargement}
        envies={envies}
        genreChoisi={!genreLu || genre?.choix !== null}
        enCours={accueil.enCours}
        refus={refus}
        onDemander={(id) => void demander(id)}
        onModifierEnvies={() => setFeuilleEnvies(true)}
      />
      {fil.donnees ? <SectionFilMiamis evenements={fil.donnees.evenements} /> : null}
      <FeuilleMesEnvies
        visible={feuilleEnvies}
        envies={envies}
        onEnregistrer={(nouvelles) => {
          void modifierEnvies(nouvelles);
          setFeuilleEnvies(false);
        }}
        onFermer={() => setFeuilleEnvies(false)}
      />
    </View>
  );
}
