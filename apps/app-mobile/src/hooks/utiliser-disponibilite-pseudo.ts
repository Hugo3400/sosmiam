import { useEffect, useState } from "react";

import { utiliserSession } from "~/hooks/utiliser-session";

/**
 * « inutile » : rien à vérifier ; « inconnu » : le serveur n'a pas pu répondre (pas de réseau, trop de demandes), on ne
 * dit rien et l'enregistrement tranchera ; « mis-de-cote » : ton ancien pseudo, retiré par l'équipe
 */
export type DisponibilitePseudo = "inutile" | "verification" | "libre" | "pris" | "mis-de-cote" | "inconnu";

/** Attente après la dernière frappe : une saisie normale reste loin des 60 demandes par 10 minutes du serveur */
const ATTENTE_MS = 600;

/**
 * Le pseudo tapé dans Mes infos est-il libre ? Demandé au serveur (GET /comptes/pseudo-disponible) 600 ms après la dernière
 * frappe, seulement si `aVerifier` (compte connecté, pseudo changé, de bonne forme et sans gros mot). Une réponse
 * arrivée après une autre frappe est ignorée ; les réponses sont gardées le temps de l'écran (revenir à un pseudo déjà
 * vérifié ne redemande rien, une réponse ratée non plus). `misDeCote` : ton ancien pseudo retiré par l'équipe (le serveur
 * dit juste « pas libre »).
 */
export function utiliserDisponibilitePseudo(pseudo: string, aVerifier: boolean, misDeCote: string | null): DisponibilitePseudo {
  const { comptes } = utiliserSession();
  // Les réponses du serveur (true : libre) ; null : pas de réponse (on n'insiste pas : l'enregistrement tranchera)
  const [reponses, setReponses] = useState<Readonly<Record<string, boolean | null>>>({});
  const connue = reponses[pseudo];

  useEffect(() => {
    if (!aVerifier || connue !== undefined) return;
    let perime = false;
    const minuterie = setTimeout(() => {
      void comptes.pseudoDisponible(pseudo).then((r) => {
        if (!perime) setReponses((avant) => ({ ...avant, [pseudo]: r.ok ? r.disponible : null }));
      });
    }, ATTENTE_MS);
    return () => {
      perime = true;
      clearTimeout(minuterie);
    };
  }, [pseudo, aVerifier, connue, comptes]);

  if (!aVerifier) return "inutile";
  if (connue === undefined) return "verification";
  if (connue === null) return "inconnu";
  if (connue) return "libre";
  return pseudo === misDeCote ? "mis-de-cote" : "pris";
}
