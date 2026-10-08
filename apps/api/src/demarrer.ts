// Point d'entrée de l'API de SOS Miam. Elle n'écoute qu'en local (127.0.0.1) : seuls le site et nos scripts lui parlent.
// Lancement : npm start (ou npm run dev, qui relance à chaque modification). Réglages : .env (DATABASE_URL, HOST, PORT).
import { creerApplication } from "./application.ts";
import { baseDeDonnees } from "./base-de-donnees/connexion.ts";
import { enregistrerInscription } from "./services/inscriptions.ts";

const hote = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT) || 5192;

const serveur = creerApplication({ enregistrerInscription }).listen(port, hote, () => {
  console.log(`API SOS Miam prête sur http://${hote}:${port}`);
});

// Arrêt propre (pm2 reload, Ctrl+C) : on finit les requêtes en cours, puis on ferme la base
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    serveur.close(() => {
      baseDeDonnees.$disconnect().finally(() => process.exit(0));
    });
  });
}
