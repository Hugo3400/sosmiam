// Inscrits à la newsletter et newsletters en préparation, pour le logiciel de gestion.
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";

/** Après 3 ans sans aucun message, on redemande à la personne si elle veut continuer (voir docs/decisions.md). */
const DELAI_RELANCE = 3 * 365 * 86_400_000;
const PAR_PAGE = 50;
/** Lu par scripts/recuperer-inscrits.py : une désinscription faite ici vaut aussi pour les inscriptions reçues par mail */
const FICHIER_DESINSCRITS = process.env.FICHIER_DESINSCRITS || "/root/sos-miam-donnees/desinscrits.txt";

export type FiltresInscrits = {
  recherche: string;
  ville: string;
  ambassadeur: boolean;
  /** Veut tester l'app avant sa sortie */
  beta: boolean;
  /** « iphone », « android », ou vide pour tous */
  telephone: string;
  aRelancer: boolean;
  page: number;
};

function construireFiltre({ recherche, ville, ambassadeur, beta, telephone, aRelancer }: FiltresInscrits, maintenant: Date): Prisma.InscriptionNewsletterWhereInput {
  return {
    ...(recherche ? { OR: [{ email: { contains: recherche, mode: "insensitive" } }, { ville: { contains: recherche, mode: "insensitive" } }] } : {}),
    ...(ville ? { ville: { equals: ville, mode: "insensitive" } } : {}),
    ...(ambassadeur ? { ambassadeur: true } : {}),
    ...(beta ? { beta: true } : {}),
    ...(telephone ? { telephone } : {}),
    ...(aRelancer ? { derniereInscription: { lt: new Date(maintenant.getTime() - DELAI_RELANCE) } } : {}),
  };
}

export async function listerInscrits(filtres: FiltresInscrits, maintenant = new Date()) {
  const ou = construireFiltre(filtres, maintenant);
  const [total, trouves, inscrits, villes, ambassadeurs, aRelancer, recents, beta, telephones] = await Promise.all([
    baseDeDonnees.inscriptionNewsletter.count(),
    baseDeDonnees.inscriptionNewsletter.count({ where: ou }),
    baseDeDonnees.inscriptionNewsletter.findMany({ where: ou, orderBy: { premiereInscription: "desc" }, skip: (filtres.page - 1) * PAR_PAGE, take: PAR_PAGE }),
    baseDeDonnees.inscriptionNewsletter.groupBy({ by: ["ville"], _count: { _all: true }, orderBy: { _count: { ville: "desc" } }, take: 15 }),
    baseDeDonnees.inscriptionNewsletter.count({ where: { ambassadeur: true } }),
    baseDeDonnees.inscriptionNewsletter.count({ where: { derniereInscription: { lt: new Date(maintenant.getTime() - DELAI_RELANCE) } } }),
    baseDeDonnees.inscriptionNewsletter.count({ where: { premiereInscription: { gte: new Date(maintenant.getTime() - 7 * 86_400_000) } } }),
    baseDeDonnees.inscriptionNewsletter.count({ where: { beta: true } }),
    baseDeDonnees.inscriptionNewsletter.groupBy({ by: ["telephone"], _count: { _all: true } }),
  ]);
  return {
    total,
    trouves,
    parPage: PAR_PAGE,
    compteurs: {
      ambassadeurs,
      aRelancer,
      recents,
      beta,
      iphone: telephones.find((groupe) => groupe.telephone === "iphone")?._count._all ?? 0,
      android: telephones.find((groupe) => groupe.telephone === "android")?._count._all ?? 0,
    },
    villes: villes.map((groupe) => ({ ville: groupe.ville ?? "Sans ville", nombre: groupe._count._all })),
    inscrits: inscrits.map((inscrit) => ({
      ...inscrit,
      aRelancer: maintenant.getTime() - inscrit.derniereInscription.getTime() > DELAI_RELANCE,
    })),
  };
}

/**
 * Désinscrit une personne : sa ligne est effacée de la base, et son adresse est notée (avec la date) dans le fichier
 * des désinscrits, pour que scripts/recuperer-inscrits.py ne la remette pas depuis la boîte mail. Faux si introuvable.
 */
export async function desinscrire(id: number, maintenant = new Date()): Promise<boolean> {
  const inscrit = await baseDeDonnees.inscriptionNewsletter.findUnique({ where: { id }, select: { email: true } });
  if (!inscrit) return false;
  await mkdir(dirname(FICHIER_DESINSCRITS), { recursive: true, mode: 0o700 });
  await appendFile(FICHIER_DESINSCRITS, `${inscrit.email} ${maintenant.toISOString().slice(0, 10)}\n`, { mode: 0o600 });
  await baseDeDonnees.inscriptionNewsletter.delete({ where: { id } });
  return true;
}

/** Tous les inscrits de la base, au format CSV (séparateur « ; », s'ouvre tel quel dans un tableur). */
export async function exporterInscrits(maintenant = new Date()): Promise<string> {
  const inscrits = await baseDeDonnees.inscriptionNewsletter.findMany({ orderBy: { premiereInscription: "asc" } });
  const proteger = (valeur: string) => (/[";\n]|^[=+\-@]/.test(valeur) ? `"${valeur.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : valeur);
  const lignes = inscrits.map((inscrit) =>
    [
      inscrit.email,
      inscrit.ville ?? "",
      inscrit.ambassadeur ? "oui" : "non",
      inscrit.beta ? "oui" : "non",
      inscrit.telephone ?? "",
      inscrit.source,
      inscrit.premiereInscription.toISOString().slice(0, 10),
      inscrit.derniereInscription.toISOString().slice(0, 10),
      maintenant.getTime() - inscrit.derniereInscription.getTime() > DELAI_RELANCE ? "oui" : "non",
    ].map(proteger).join(";"),
  );
  return ["email;ville;ambassadeur;beta;telephone;source;premiere_inscription;derniere_inscription;a_relancer", ...lignes].join("\r\n") + "\r\n";
}

export type BrouillonSaisi = { objet: string; texte: string };

export const listerBrouillons = () =>
  baseDeDonnees.brouillonNewsletter.findMany({ orderBy: { modifieLe: "desc" }, select: { id: true, objet: true, creeLe: true, modifieLe: true } });
export const lireBrouillon = (id: number) => baseDeDonnees.brouillonNewsletter.findUnique({ where: { id } });
export const creerBrouillon = (saisie: BrouillonSaisi) => baseDeDonnees.brouillonNewsletter.create({ data: saisie });
export const modifierBrouillon = (id: number, saisie: BrouillonSaisi) =>
  baseDeDonnees.brouillonNewsletter.update({ where: { id }, data: saisie }).catch(() => null);
export const supprimerBrouillon = (id: number) =>
  baseDeDonnees.brouillonNewsletter.delete({ where: { id } }).then(() => true, () => false);
