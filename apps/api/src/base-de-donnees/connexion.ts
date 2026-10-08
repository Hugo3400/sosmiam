// Une seule connexion à PostgreSQL pour tout le serveur (Prisma 7 passe par le pilote « pg »).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./client-genere/client.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manque : voir apps/api/.env");

// La base est réglée sur l'heure de Paris, mais Prisma envoie les dates en UTC sans fuseau :
// sans ce réglage, elles seraient décalées de 1 ou 2 heures.
// SCHEMA_BASE (facultatif) : un autre schéma que « public », pour un essai qui ne touche pas aux vraies données.
const adaptateur = new PrismaPg(
  { connectionString: process.env.DATABASE_URL, options: "-c TimeZone=UTC" },
  process.env.SCHEMA_BASE ? { schema: process.env.SCHEMA_BASE } : undefined,
);

export const baseDeDonnees = new PrismaClient({ adapter: adaptateur });
