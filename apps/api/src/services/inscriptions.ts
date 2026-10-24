import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { Langue } from "../../../../packages/commun/src/regles/langues.ts";
import { lireLangueDemande } from "../middlewares/poser-langue.ts";

export type Telephone = "iphone" | "android";

export type NouvelleInscription = {
  email: string;
  ville: string | null;
  ambassadeur: boolean;
  /** iPhone ou Android, pour savoir sur quel store publier l'app ; null si la personne ne l'a pas dit */
  telephone: Telephone | null;
  /** La personne veut tester l'app avant sa sortie */
  beta: boolean;
  source: string;
  langue?: Langue;
};

/**
 * Inscrit une adresse à la newsletter. Si elle l'est déjà, on garde sa première date d'inscription et on met à jour
 * la dernière. Une nouvelle ville ou un nouveau téléphone remplacent l'ancien (une réponse vide n'efface rien),
 * et les cases ambassadeur et bêta restent cochées une fois cochées.
 */
export async function enregistrerInscription(
  { email, ville, ambassadeur, telephone, beta, source, langue: langueDonnee }: NouvelleInscription,
  client: Prisma.TransactionClient | typeof baseDeDonnees = baseDeDonnees,
  maintenant = new Date(),
): Promise<void> {
  const langue = langueDonnee ?? lireLangueDemande();
  await client.inscriptionNewsletter.upsert({
    where: { email },
    create: { email, ville, ambassadeur, telephone, beta, source, langue, premiereInscription: maintenant, derniereInscription: maintenant },
    update: {
      derniereInscription: maintenant,
      langue,
      ...(ville ? { ville } : {}),
      ...(telephone ? { telephone } : {}),
      ...(ambassadeur ? { ambassadeur: true } : {}),
      ...(beta ? { beta: true } : {}),
    },
  });
}
