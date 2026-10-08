// Envoi de la newsletter depuis le logiciel de gestion : on synchronise d'abord la boîte (les désinscriptions reçues par
// mail sont retirées « avant tout nouvel envoi », comme promis), puis chaque inscrit de la liste reçoit sa ligne dans la
// file d'attente. Le contenu (HTML et texte) est rendu par le logiciel, avec son pied de page de désinscription.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { envoyerToutDeSuite } from "../courriels/file-courriels.ts";
import { lireReglagesEnvoi } from "../courriels/reglages-envoi.ts";
import { lireListeInscrits, synchroniserBoite } from "./boite-mail.ts";

export type SaisieCampagne = { brouillonId: number | null; objet: string; html: string; texte: string; ville: string | null };

const meme = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;

/** Combien recevraient la newsletter (toute la liste, ou une ville), d'après la dernière synchronisation. */
export async function compterDestinataires(ville: string | null) {
  const liste = await lireListeInscrits();
  if (!liste) return null;
  return new Set(liste.filter((inscrit) => !ville || meme(inscrit.ville, ville)).map((inscrit) => inscrit.adresse)).size;
}

/** Crée l'envoi d'une newsletter. Rend la campagne, ou la raison pour laquelle elle ne part pas. */
export async function lancerCampagne(saisie: SaisieCampagne) {
  const { etat } = await lireReglagesEnvoi();
  if (etat !== "pret") return { erreur: `envoi-${etat}` as const };
  // Une newsletter déjà en train de partir : on n'en lance pas une deuxième par erreur (double clic)
  if (await baseDeDonnees.envoiCourriel.count({ where: { campagneId: { not: null }, statut: "en-attente" } })) return { erreur: "envoi-en-cours" as const };
  const synchro = await synchroniserBoite();
  if (!synchro.ok) return { erreur: "synchro-impossible" as const, message: synchro.message };
  const liste = await lireListeInscrits();
  const destinataires = [...new Set((liste ?? []).filter((inscrit) => !saisie.ville || meme(inscrit.ville, saisie.ville)).map((inscrit) => inscrit.adresse))];
  if (destinataires.length === 0) return { erreur: "aucun-destinataire" as const };
  const campagne = await baseDeDonnees.campagneNewsletter.create({
    data: { ...saisie, total: destinataires.length, envois: { createMany: { data: destinataires.map((destinataire) => ({ type: "newsletter", destinataire })) } } },
    select: { id: true, total: true },
  });
  return { campagne };
}

/** Les newsletters envoyées, avec où en est chacune (envoyés, en attente, échecs, annulés). */
export async function listerCampagnes() {
  const [campagnes, comptes] = await Promise.all([
    baseDeDonnees.campagneNewsletter.findMany({ orderBy: { creeLe: "desc" }, take: 30, select: { id: true, brouillonId: true, objet: true, ville: true, total: true, creeLe: true } }),
    baseDeDonnees.envoiCourriel.groupBy({ by: ["campagneId", "statut"], where: { campagneId: { not: null } }, _count: { _all: true } }),
  ]);
  return campagnes.map((campagne) => ({
    ...campagne,
    statuts: Object.fromEntries(comptes.filter((c) => c.campagneId === campagne.id).map((c) => [c.statut, c._count._all])) as Record<string, number>,
  }));
}

/** Arrête une newsletter en cours : les mails pas encore partis sont annulés. Rend leur nombre. */
export async function annulerCampagne(id: number) {
  const { count } = await baseDeDonnees.envoiCourriel.updateMany({ where: { campagneId: id, statut: "en-attente" }, data: { statut: "annule", erreur: "Envoi arrêté depuis le logiciel" } });
  return count;
}

/** Un essai, tout de suite, à une seule adresse (la tienne) : pour voir le vrai rendu dans une vraie messagerie. */
export async function envoyerEssaiNewsletter(adresse: string, contenu: { objet: string; html: string; texte: string }) {
  return envoyerToutDeSuite("essai", adresse, { ...contenu, objet: `[Essai] ${contenu.objet}` });
}
