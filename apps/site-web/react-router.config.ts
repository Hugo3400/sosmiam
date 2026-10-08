import type { Config } from "@react-router/dev/config";

export default {
  // Le code du site est dans src/ (et pas dans app/, pour ne pas confondre avec l'app mobile)
  appDirectory: "src",
  // Mise en ligne : chaque version est construite dans versions/<date> (voir scripts/deployer-site.sh)
  buildDirectory: process.env.DOSSIER_BUILD ?? "build",
  // Rendu côté serveur : indispensable pour que Google lise les pages
  ssr: true,
  // Domaines autorisés à envoyer les formulaires (actions). Derrière nginx, le serveur voit « http://sosmiam.fr » alors que
  // le navigateur annonce « https://sosmiam.fr » : sans cette liste, React Router croit à un envoi venu d'un autre site
  // et répond 400. Les autres sites restent refusés.
  allowedActionOrigins: ["sosmiam.fr", "apercu.sosmiam.fr", "ambassadeur.sosmiam.fr"],
} satisfies Config;
