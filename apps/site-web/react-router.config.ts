import type { Config } from "@react-router/dev/config";

export default {
  // Le code du site est dans src/ (et pas dans app/, pour ne pas confondre avec l'app mobile)
  appDirectory: "src",
  // Mise en ligne : chaque version est construite dans versions/<date> (voir scripts/deployer-site.sh)
  buildDirectory: process.env.DOSSIER_BUILD ?? "build",
  // Rendu côté serveur : indispensable pour que Google lise les pages
  ssr: true,
} satisfies Config;
