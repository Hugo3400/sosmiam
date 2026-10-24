import { useEffect } from "react";

import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { estEnRelance } from "~/fonctions/newsletter/est-en-relance.ts";
import { lireEtatEnvois, listerCampagnes, listerDerniersEnvois } from "~/services/courriels.ts";
import { CarteEtatEnvoi } from "./CarteEtatEnvoi.tsx";
import { ListeCampagnes } from "./ListeCampagnes.tsx";
import { ListeDerniersMails } from "./ListeDerniersMails.tsx";

export function SuiviEnvois() {
  const etat = utiliserChargement(lireEtatEnvois, []);
  const campagnes = utiliserChargement(listerCampagnes, []);
  const derniers = utiliserChargement(listerDerniersEnvois, []);
  const actualiser = () => {
    etat.recharger();
    campagnes.recharger();
    derniers.recharger();
  };
  const aSuivre = (etat.donnees?.enAttente ?? 0) > 0 || (derniers.donnees ?? []).some((envoi) => estEnRelance(envoi));
  useEffect(() => {
    if (!aSuivre) return;
    const minuteur = setInterval(actualiser, 15_000);
    return () => clearInterval(minuteur);
  }, [aSuivre]);

  return (
    <div className="grid gap-5">
      <MessageErreur erreur={etat.erreur ?? campagnes.erreur ?? derniers.erreur} reessayer={actualiser} />
      {!etat.donnees && etat.chargement && <Chargement />}
      {etat.donnees && <CarteEtatEnvoi etat={etat.donnees} />}
      {campagnes.donnees && <ListeCampagnes campagnes={campagnes.donnees} onChange={actualiser} />}
      {derniers.donnees && <ListeDerniersMails envois={derniers.donnees} />}
    </div>
  );
}
