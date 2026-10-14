// Désinscription par le lien signé : l'inscrit est retrouvé par son adresse, puis désinscrit par desinscrire() du
// logiciel de gestion (services/gestion/newsletter.ts), qui note aussi l'adresse dans le fichier des désinscrits.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

/** L'id de l'inscrit à la newsletter qui a cette adresse (enregistrée en minuscules), ou null. */
export async function trouverInscritNewsletter(email: string): Promise<number | null> {
  const inscrit = await baseDeDonnees.inscriptionNewsletter.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  return inscrit?.id ?? null;
}
