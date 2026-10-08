import { defineConfig } from "prisma/config";

// Prisma 7 ne lit plus le fichier .env tout seul : on le charge ici (s'il existe) pour les commandes prisma
try {
  process.loadEnvFile(".env");
} catch {
  // Pas de .env : DATABASE_URL vient alors de l'environnement
}

export default defineConfig({
  // Un fichier par domaine (base, newsletter, courriels, notifications, statistiques, lieux, big-sos, gestion, comptes, ambassadeurs)
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
