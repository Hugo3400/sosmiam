import { useEffect, useRef, useState } from "react";

import type { Visite } from "@sos-miam/commun/types/visite";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

/** Les visites validées de la liste, en une clé (« 12,15,18 ») */
const lireCleValidees = (visites: Visite[]) =>
  visites
    .filter((v) => v.statut === "validee")
    .map((v) => v.id)
    .join(",");

/**
 * Tous tes points. Avec un compte : ceux du serveur (rescousses, premier sauveteur, visites, avis… tout y est déjà compté ;
 * 0 tant que le compte n'est pas relu), plus ceux des visites validées arrivées dans ta liste depuis que ce compte est là :
 * les points suivent toujours la liste des visites (la fête d'une visite regarde si elle y est déjà). Le compte est relu à
 * l'arrivée et à chaque visite validée en plus, pour que ses points rattrapent la liste. En démo : ceux que le téléphone
 * sait compter (rescousses, premiers sauvetages, défis réussis) plus ceux des visites validées et des avis avec photo,
 * rendus par les services de la démo.
 */
export function utiliserPointsTotaux(): number {
  const activite = utiliserActivite();
  const { points, visites } = utiliserVisites();
  const { compte, rafraichir } = utiliserSession();
  const cle = lireCleValidees(visites);
  // Les visites validées que la liste montrait quand ce compte est arrivé : ses points les comptent déjà
  const [connues, setConnues] = useState(() => ({ compte, cle }));
  if (connues.compte !== compte) setConnues({ compte, cle });
  // Le compte relu à l'arrivée (une visite vient d'être validée), puis à chaque visite validée en plus dans la liste
  const cleVue = useRef<string | null>(null);
  useEffect(() => {
    if (DEMO_VISITES_ACTIVE || cleVue.current === cle) return;
    cleVue.current = cle;
    void rafraichir();
  }, [cle, rafraichir]);

  if (!DEMO_VISITES_ACTIVE) {
    if (!compte) return 0;
    const dejaComptees = new Set(connues.compte === compte ? connues.cle.split(",") : cle.split(","));
    const enPlus = visites.filter((v) => v.statut === "validee" && !dejaComptees.has(String(v.id))).reduce((total, v) => total + v.points, 0);
    return compte.points + enPlus;
  }
  const mesures: MesuresActivite = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  return calculerPointsLocaux(mesures) + points;
}
