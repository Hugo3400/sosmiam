import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

export type NouvelleInscription = {
  email: string;
  ville: string | null;
  ambassadeur: boolean;
  source: string;
};

/**
 * Inscrit une adresse à la newsletter. Si elle l'est déjà, on garde sa première date d'inscription,
 * on met à jour la dernière, la ville (si une nouvelle est donnée) et l'envie d'être ambassadeur.
 */
export async function enregistrerInscription({ email, ville, ambassadeur, source }: NouvelleInscription): Promise<void> {
  await baseDeDonnees.inscriptionNewsletter.upsert({
    where: { email },
    create: { email, ville, ambassadeur, source },
    update: {
      derniereInscription: new Date(),
      ...(ville ? { ville } : {}),
      ...(ambassadeur ? { ambassadeur: true } : {}),
    },
  });
}
