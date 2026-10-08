// Envois groupés depuis le logiciel de gestion, à un public choisi : les inscrits de la newsletter (filtrés par ville,
// candidats ambassadeurs, bêta-testeurs, téléphone) ou les ambassadeurs (actifs, ou tous, d'une ville). Le logiciel
// montre la liste exacte et Hugo coche qui reçoit ; le serveur ne garde que des adresses qui font bien partie du public.
// Pour la newsletter, la boîte est synchronisée juste avant (les désinscriptions partent « avant tout nouvel envoi »).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { filtrerInscrits, type FiltresInscrits } from "../../fonctions/courriels/filtrer-inscrits.ts";
import { envoyerToutDeSuite } from "../courriels/file-courriels.ts";
import { lireReglagesEnvoi } from "../courriels/reglages-envoi.ts";
import { lireListeInscrits, synchroniserBoite } from "./boite-mail.ts";

export type PublicEnvoi =
  | ({ public: "newsletter" } & FiltresInscrits)
  | { public: "ambassadeurs"; statut: "actif" | "tous"; ville: string | null };
export type Destinataire = { adresse: string; ville: string; detail: string };
export type SaisieCampagne = {
  cible: PublicEnvoi;
  /** Les adresses cochées dans le logiciel (null : tout le public) */
  adresses: string[] | null;
  description: string;
  brouillonId: number | null;
  objet: string;
  html: string;
  texte: string;
};

const meme = (a: string, b: string) => a.trim().localeCompare(b.trim(), "fr", { sensitivity: "base" }) === 0;
const TELEPHONES: Record<string, string> = { iphone: "iPhone", android: "Android" };

/** Le public choisi, adresse par adresse (null si la liste des inscrits n'a jamais été synchronisée). */
export async function listerDestinataires(cible: PublicEnvoi): Promise<Destinataire[] | null> {
  if (cible.public === "ambassadeurs") {
    const comptes = await baseDeDonnees.compte.findMany({
      where: { ambassadeur: { is: { ...(cible.statut === "actif" ? { statut: "actif" } : { statut: { not: "refuse" } }) } } },
      orderBy: { prenom: "asc" },
      select: { email: true, prenom: true, ambassadeur: { select: { ville: true, statut: true } } },
    });
    return comptes
      .filter((c) => !cible.ville || meme(c.ambassadeur?.ville ?? "", cible.ville))
      .map((c) => ({ adresse: c.email, ville: c.ambassadeur?.ville ?? "", detail: c.ambassadeur?.statut === "actif" ? c.prenom : `${c.prenom} (${c.ambassadeur?.statut})` }));
  }
  const liste = await lireListeInscrits();
  if (!liste) return null;
  const candidats = new Set(
    cible.candidats ? (await baseDeDonnees.inscriptionNewsletter.findMany({ where: { ambassadeur: true }, select: { email: true } })).map((i) => i.email) : [],
  );
  return filtrerInscrits(liste, cible, candidats).map((inscrit) => ({
    adresse: inscrit.adresse,
    ville: inscrit.ville,
    detail: [inscrit.beta === "oui" ? "bêta" : "", TELEPHONES[inscrit.telephone] ?? "", candidats.has(inscrit.adresse) ? "candidat ambassadeur" : ""].filter(Boolean).join(" · "),
  }));
}

/** Lance un envoi groupé. Rend la campagne, ou la raison pour laquelle elle ne part pas. */
export async function lancerCampagne({ cible, adresses, description, ...contenu }: SaisieCampagne) {
  const { etat } = await lireReglagesEnvoi();
  if (etat !== "pret") return { erreur: `envoi-${etat}` as const };
  // Un envoi groupé déjà en train de partir : on n'en lance pas un deuxième par erreur (double clic)
  if (await baseDeDonnees.envoiCourriel.count({ where: { campagneId: { not: null }, statut: "en-attente" } })) return { erreur: "envoi-en-cours" as const };
  if (cible.public === "newsletter") {
    const synchro = await synchroniserBoite();
    if (!synchro.ok) return { erreur: "synchro-impossible" as const, message: synchro.message };
  }
  const autorises = (await listerDestinataires(cible))?.map((d) => d.adresse) ?? [];
  const choisies = adresses ? new Set(adresses.map((a) => a.trim().toLowerCase())) : null;
  const destinataires = choisies ? autorises.filter((adresse) => choisies.has(adresse)) : autorises;
  if (destinataires.length === 0) return { erreur: "aucun-destinataire" as const };
  const campagne = await baseDeDonnees.campagneNewsletter.create({
    data: {
      ...contenu,
      public: cible.public,
      description,
      ville: cible.ville,
      total: destinataires.length,
      envois: { createMany: { data: destinataires.map((destinataire) => ({ type: cible.public === "newsletter" ? "newsletter" : "ambassadeurs", destinataire })) } },
    },
    select: { id: true, total: true },
  });
  return { campagne };
}

/** Les envois groupés, avec où en est chacun (envoyés, en attente, échecs, annulés). */
export async function listerCampagnes() {
  const [campagnes, comptes] = await Promise.all([
    baseDeDonnees.campagneNewsletter.findMany({
      orderBy: { creeLe: "desc" },
      take: 30,
      select: { id: true, brouillonId: true, objet: true, public: true, description: true, ville: true, total: true, creeLe: true },
    }),
    baseDeDonnees.envoiCourriel.groupBy({ by: ["campagneId", "statut"], where: { campagneId: { not: null } }, _count: { _all: true } }),
  ]);
  return campagnes.map((campagne) => ({
    ...campagne,
    statuts: Object.fromEntries(comptes.filter((c) => c.campagneId === campagne.id).map((c) => [c.statut, c._count._all])) as Record<string, number>,
  }));
}

/** Arrête un envoi en cours : les mails pas encore partis sont annulés. Rend leur nombre. */
export async function annulerCampagne(id: number) {
  const { count } = await baseDeDonnees.envoiCourriel.updateMany({ where: { campagneId: id, statut: "en-attente" }, data: { statut: "annule", erreur: "Envoi arrêté depuis le logiciel" } });
  return count;
}

/** Un essai, tout de suite, à une seule adresse (la tienne) : pour voir le vrai rendu dans une vraie messagerie. */
export async function envoyerEssaiNewsletter(adresse: string, contenu: { objet: string; html: string; texte: string }) {
  return envoyerToutDeSuite("essai", adresse, { ...contenu, objet: `[Essai] ${contenu.objet}` });
}
