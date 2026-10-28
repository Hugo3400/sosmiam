import { useEffect, useRef, useState } from "react";

import type { Visite } from "@sos-miam/commun/types/visite";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserVisites } from "~/hooks/utiliser-visites";

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
 * l'arrivée et à chaque visite validée en plus, pour que ses points rattrapent la liste.
 */
export function utiliserPointsTotaux(): number {
  const { visites } = utiliserVisites();
  const { compte, rafraichir } = utiliserSession();
  const cle = lireCleValidees(visites);
  // Les visites validées que la liste montrait quand ce compte est arrivé : ses points les comptent déjà
  const [connues, setConnues] = useState(() => ({ compte, cle }));
  if (connues.compte !== compte) setConnues({ compte, cle });
  // Le compte relu à l'arrivée (une visite vient d'être validée), puis à chaque visite validée en plus dans la liste
  const cleVue = useRef<string | null>(null);
  useEffect(() => {
    if (cleVue.current === cle) return;
    cleVue.current = cle;
    void rafraichir();
  }, [cle, rafraichir]);

  if (!compte) return 0;
  const dejaComptees = new Set(connues.compte === compte ? connues.cle.split(",") : cle.split(","));
  const enPlus = visites.filter((v) => v.statut === "validee" && !dejaComptees.has(String(v.id))).reduce((total, v) => total + v.points, 0);
  return compte.points + enPlus;
}
