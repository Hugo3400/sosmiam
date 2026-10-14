// Journal des requêtes du serveur de production (lancer-serveur.js), lu par pm2 et gardé 14 jours au plus
// (/etc/logrotate.d/sos-miam-pm2). Une ligne par requête, à la fin de la réponse : « GET /lieux/12 200 - 4.213 ms ».
// Seulement la méthode, le chemin (masquerCheminJournal : sans paramètres, sans fragment, sans code de QR ni pseudo), le
// statut et la durée : ni adresse IP, ni navigateur, ni page d'origine, ni paramètre de l'adresse (audit du 14 octobre 2026).
import morgan from "morgan";

import { masquerCheminJournal } from "./masquer-chemin-journal.js";

/**
 * Middleware du journal (morgan, comme react-router-serve, mais avec notre propre ligne au lieu de « tiny »).
 * @param {{ write(ligne: string): unknown }} [flux] où écrire (la sortie standard, lue par pm2 ; un faux flux dans les tests)
 */
export function journaliserRequetes(flux = process.stdout) {
  return morgan(
    (jetons, requete, reponse) => {
      const statut = jetons.status(requete, reponse) ?? "-";
      const duree = jetons["response-time"](requete, reponse) ?? "-";
      return `${requete.method} ${masquerCheminJournal(requete.originalUrl ?? requete.url)} ${statut} - ${duree} ms`;
    },
    { stream: flux },
  );
}
