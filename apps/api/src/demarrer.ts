// Point d'entrée de l'API de SOS Miam. Elle n'écoute qu'en local (127.0.0.1) : le site lui parle côté serveur, et seul
// le chemin /api-gestion est joignable de l'extérieur (nginx), pour le logiciel de gestion, avec des demandes signées.
// Lancement : npm start (ou npm run dev, qui relance à chaque modification). Réglages : .env (DATABASE_URL, HOST, PORT).
import { creerApplication } from "./application.ts";
import { listerAnnoncesAPublier, noterPublicationAnnonce } from "./services/annonces-discord.ts";
import { baseDeDonnees } from "./base-de-donnees/connexion.ts";
import { enregistrerDemandeLieu } from "./services/demandes-lieux.ts";
import { creerLecteurAcces } from "./services/gestion/acces.ts";
import { enregistrerSignalement } from "./services/gestion/moderation.ts";
import { servicesGestion } from "./services/gestion/tous-les-services.ts";
import { enregistrerInscription } from "./services/inscriptions.ts";
import { listerLieuxPublics } from "./services/lieux-publics.ts";
import { trouverCommune } from "./services/localisation.ts";
import { creerCompteurVisites } from "./services/mesure.ts";
import { stockageStats } from "./services/stockage-stats.ts";
import { planifierTachesDeNuit } from "./taches/taches-de-nuit.ts";

const hote = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT) || 5192;

const compteur = creerCompteurVisites(stockageStats);
const vider = () => compteur.vider().catch((erreur: unknown) => console.error("Écriture des statistiques impossible :", erreur));
const minuteur = setInterval(vider, 30_000);
// Ménage et sauvegarde chiffrée de la base chaque nuit (pas pendant un essai sur un autre schéma)
const arreterSauvegardes = process.env.SCHEMA_BASE ? () => {} : planifierTachesDeNuit();
void vider(); // ferme tout de suite les périodes terminées pendant que l'API était arrêtée

const serveur = creerApplication({
  enregistrerInscription,
  enregistrerVue: compteur.enregistrerVue,
  enregistrerSignalement,
  trouverCommune,
  listerLieuxPublics,
  enregistrerDemandeLieu,
  bot: { enregistrerDemandeLieu, listerAnnoncesAPublier, noterPublicationAnnonce },
  gestion: { lireAcces: creerLecteurAcces(), services: servicesGestion },
}).listen(port, hote, () => {
  console.log(`API SOS Miam prête sur http://${hote}:${port}`);
});

// Arrêt propre (pm2 reload, Ctrl+C) : on finit les requêtes en cours, on écrit les derniers totaux, puis on ferme la base
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    clearInterval(minuteur);
    arreterSauvegardes();
    serveur.close(() => {
      vider().finally(() => baseDeDonnees.$disconnect().finally(() => process.exit(0)));
    });
  });
}
