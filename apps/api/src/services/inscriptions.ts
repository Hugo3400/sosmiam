import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

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
};

/**
 * Inscrit une adresse à la newsletter. Si elle l'est déjà, on garde sa première date d'inscription et on met à jour
 * la dernière. Une nouvelle ville ou un nouveau téléphone remplacent l'ancien (une réponse vide n'efface rien),
 * et les cases ambassadeur et bêta restent cochées une fois cochées.
 */
export async function enregistrerInscription({ email, ville, ambassadeur, telephone, beta, source }: NouvelleInscription): Promise<void> {
  await baseDeDonnees.inscriptionNewsletter.upsert({
    where: { email },
    create: { email, ville, ambassadeur, telephone, beta, source },
    update: {
      derniereInscription: new Date(),
      ...(ville ? { ville } : {}),
      ...(telephone ? { telephone } : {}),
      ...(ambassadeur ? { ambassadeur: true } : {}),
      ...(beta ? { beta: true } : {}),
    },
  });
}
