import { useEffect, useRef, useState } from "react";

import { deciderEtatVersion, type EtatVersion } from "~/fonctions/version/decider-etat-version";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { PLATEFORME_STORE, VERSION_INSTALLEE } from "~/services/version-installee";
import { lireVersionsAppServeur } from "~/services/versions-app-serveur";

const ECART_LECTURES_MS = 30 * 60_000;
const ECART_ESSAIS_MS = 60_000;

const A_JOUR: EtatVersion = { etat: "a-jour" };

function estMemeEtat(a: EtatVersion, b: EtatVersion): boolean {
  if (a.etat === "nouvelle-version") return b.etat === "nouvelle-version" && a.version === b.version;
  return a.etat === b.etat;
}

export function utiliserEtatVersion(): EtatVersion {
  const retours = utiliserRetoursPremierPlan();
  const [etat, setEtat] = useState<EtatVersion>(A_JOUR);
  const prochaineLecture = useRef(0);
  const enCours = useRef(false);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  useEffect(() => {
    if (PLATEFORME_STORE === null || enCours.current || Date.now() < prochaineLecture.current) return;
    enCours.current = true;
    const reessayerPlusTard = (attenteS = 0) => {
      prochaineLecture.current = Date.now() + Math.max(ECART_ESSAIS_MS, attenteS * 1000);
    };
    Promise.resolve()
      .then(lireVersionsAppServeur)
      .then((reponse) => {
        if (!reponse.ok) return reessayerPlusTard(reponse.details?.attenteS);
        if (typeof reponse.minimale !== "object" || reponse.minimale === null) return reessayerPlusTard();
        prochaineLecture.current = Date.now() + ECART_LECTURES_MS;
        const suivant = deciderEtatVersion({ installee: VERSION_INSTALLEE, plateforme: PLATEFORME_STORE, minimale: reponse.minimale, derniere: reponse.derniere });
        if (monte.current) setEtat((avant) => (estMemeEtat(avant, suivant) ? avant : suivant));
      })
      .catch(() => reessayerPlusTard())
      .finally(() => {
        enCours.current = false;
      });
  }, [retours]);

  return etat;
}
