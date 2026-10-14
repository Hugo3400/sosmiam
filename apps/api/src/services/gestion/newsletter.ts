// Inscrits à la newsletter et newsletters en préparation, pour le logiciel de gestion.
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { garderDesinscritsRecents } from "../../fonctions/courriels/garder-desinscrits-recents.ts";

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

/**
 * Note une désinscription (lien d'un mail, « un clic » d'une messagerie) dans la liste des désinscrits : adresse en
 * minuscules et date, une seule fois. La synchronisation de la liste la respecte ensuite.
 */
export async function noterDesinscription(email: string, maintenant = new Date()): Promise<void> {
  const adresse = email.trim().toLowerCase();
  const desinscrits = await readFile(FICHIER_DESINSCRITS, "utf8").catch(() => "");
  if (desinscrits.split("\n").some((ligne) => ligne.split(" ")[0]?.trim().toLowerCase() === adresse)) return;
  await mkdir(dirname(FICHIER_DESINSCRITS), { recursive: true, mode: 0o700 });
  await appendFile(FICHIER_DESINSCRITS, `${adresse} ${maintenant.toISOString().slice(0, 10)}\n`, { mode: 0o600 });
}

/**
 * Efface de la liste des désinscrits ce qui a plus de 3 ans (une ligne par adresse, la plus récente). Fichier réécrit d'un
 * coup (fichier temporaire puis renommage). Rend le nombre de lignes retirées.
 */
export async function purgerDesinscritsAnciens(maintenant = new Date()): Promise<number> {
  const texte = await readFile(FICHIER_DESINSCRITS, "utf8").catch(() => null);
  if (texte === null) return 0;
  const limite = new Date(maintenant);
  limite.setUTCFullYear(limite.getUTCFullYear() - 3);
  const { texte: garde, retires } = garderDesinscritsRecents(texte, limite.toISOString().slice(0, 10));
  if (retires === 0) return 0;
  const provisoire = `${FICHIER_DESINSCRITS}.purge`;
  await writeFile(provisoire, garde, { mode: 0o600 });
  await rename(provisoire, FICHIER_DESINSCRITS);
  return retires;
}

/**
 * Inscrit un ambassadeur validé à la newsletter (décidé par Hugo le 14 octobre 2026 : les ambassadeurs le sont par défaut),
 * sauf s'il s'en est désinscrit un jour. Rend true s'il est (ou était déjà) inscrit.
 */
export function inscrireAmbassadeurNewsletter(email: string, ville: string | null, maintenant = new Date()): Promise<boolean> {
  return inscrireCompteNewsletter(email, ville, "ambassadeur", maintenant);
}

/**
 * Inscrit un compte à la newsletter : ambassadeur validé (par défaut), ou compte de l'app qui l'a demandé (décidé par Hugo
 * le 14 octobre 2026). Jamais une adresse qui s'est désinscrite un jour. Une adresse déjà inscrite garde sa fiche : seule
 * la date de dernière inscription change (et « ambassadeur » pour un ambassadeur). Rend true si elle est inscrite.
 */
export async function inscrireCompteNewsletter(email: string, ville: string | null, source: "app" | "ambassadeur", maintenant = new Date()): Promise<boolean> {
  const adresse = email.trim().toLowerCase();
  const desinscrits = await readFile(FICHIER_DESINSCRITS, "utf8").catch(() => "");
  if (desinscrits.split("\n").some((ligne) => ligne.split(" ")[0]?.trim().toLowerCase() === adresse)) return false;
  const ambassadeur = source === "ambassadeur";
  await baseDeDonnees.inscriptionNewsletter.upsert({
    where: { email: adresse },
    create: { email: adresse, ville: ville || null, ambassadeur, source, premiereInscription: maintenant, derniereInscription: maintenant },
    update: { derniereInscription: maintenant, ...(ambassadeur ? { ambassadeur: true } : {}) },
  });
  return true;
}

/**
 * « Inscrire les comptes de l'app à la newsletter » (logiciel) : ceux qu'on a vus SUR L'APP (connexion depuis l'app, ou
 * téléphone enregistré), jamais seulement parce qu'ils ont Google ou Apple (on peut s'en servir sur le site), et jamais ceux
 * qui ont décoché la case ou se sont désinscrits (desinscrits.txt, noterRefus de la session Site). Audit du 14 octobre 2026.
 */
export async function inscrireComptesAppNewsletter(maintenant = new Date()) {
  const comptes = await baseDeDonnees.compte.findMany({
    where: { OR: [{ sessions: { some: { support: "app" } } }, { appareils: { some: {} } }] },
    select: { email: true, ville: true },
  });
  let inscrits = 0;
  for (const compte of comptes) if (await inscrireCompteNewsletter(compte.email, compte.ville, "app", maintenant)) inscrits++;
  return { comptes: comptes.length, inscrits, desinscrits: comptes.length - inscrits };
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

export type BrouillonSaisi = { objet: string; texte: string; contenu?: object };

export const listerBrouillons = () =>
  baseDeDonnees.brouillonNewsletter.findMany({ orderBy: { modifieLe: "desc" }, select: { id: true, objet: true, creeLe: true, modifieLe: true } });
export const lireBrouillon = (id: number) => baseDeDonnees.brouillonNewsletter.findUnique({ where: { id } });
export const creerBrouillon = (saisie: BrouillonSaisi) => baseDeDonnees.brouillonNewsletter.create({ data: saisie });
export const modifierBrouillon = (id: number, saisie: BrouillonSaisi) =>
  baseDeDonnees.brouillonNewsletter.update({ where: { id }, data: saisie }).catch(() => null);
export const supprimerBrouillon = (id: number) =>
  baseDeDonnees.brouillonNewsletter.delete({ where: { id } }).then(() => true, () => false);
