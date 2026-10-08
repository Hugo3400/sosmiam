// Publications du fil « Pour toi », gérées dans le logiciel de gestion.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { supprimerFichiersMedias } from "./medias.ts";

export type PublicationSaisie = {
  lieuId: number;
  auteurType: "lieu" | "createur";
  auteurPseudo: string | null;
  partenariat: string | null;
  legende: string;
  illustration: boolean;
  statut: "brouillon" | "publiee" | "masquee";
  publieeLe: Date | null;
};

const AVEC_LIEU_ET_MEDIAS = {
  lieu: { select: { id: true, nom: true, emoji: true, couleurs: true, ville: true } },
  medias: { orderBy: [{ type: "asc" as const }, { ordre: "asc" as const }] },
};

export async function listerPublications({ statut, lieuId }: { statut: string; lieuId: number | null }, maintenant = new Date()) {
  // « programmee » n'est pas un statut en base : c'est une publication publiée dont la date est à venir
  const filtreStatut =
    statut === "programmee" ? { statut: "publiee", publieeLe: { gt: maintenant } }
    : statut === "publiee" ? { statut: "publiee", publieeLe: { lte: maintenant } }
    : statut ? { statut }
    : {};
  return baseDeDonnees.publication.findMany({
    where: { ...filtreStatut, ...(lieuId ? { lieuId } : {}) },
    orderBy: [{ modifieLe: "desc" }],
    include: AVEC_LIEU_ET_MEDIAS,
  });
}

export const lirePublication = (id: number) => baseDeDonnees.publication.findUnique({ where: { id }, include: AVEC_LIEU_ET_MEDIAS });

export async function creerPublication(saisie: PublicationSaisie) {
  if (!(await baseDeDonnees.lieu.findUnique({ where: { id: saisie.lieuId }, select: { id: true } }))) return null;
  return baseDeDonnees.publication.create({ data: saisie, include: AVEC_LIEU_ET_MEDIAS });
}

export async function modifierPublication(id: number, saisie: PublicationSaisie) {
  if (!(await baseDeDonnees.lieu.findUnique({ where: { id: saisie.lieuId }, select: { id: true } }))) return null;
  return baseDeDonnees.publication.update({ where: { id }, data: saisie, include: AVEC_LIEU_ET_MEDIAS }).catch(() => null);
}

/** Change seulement le statut (masquer depuis la modération, remettre en ligne…). */
export const changerStatutPublication = (id: number, statut: PublicationSaisie["statut"]) =>
  baseDeDonnees.publication.update({ where: { id }, data: { statut } }).catch(() => null);

export async function supprimerPublication(id: number): Promise<boolean> {
  const publication = await baseDeDonnees.publication.findUnique({ where: { id }, select: { medias: { select: { fichier: true } } } });
  if (!publication) return false;
  await baseDeDonnees.publication.delete({ where: { id } });
  await supprimerFichiersMedias(publication.medias.map((media) => media.fichier));
  return true;
}
