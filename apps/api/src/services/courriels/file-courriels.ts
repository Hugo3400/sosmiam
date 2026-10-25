// File d'attente des mails : l'API la vide toutes les 20 secondes (demarrer.ts), sans dépasser la limite d'envois par
// heure de la boîte. Un envoi raté est réessayé plus tard (5 min, 30 min, 2 h, 6 h, 24 h) ; une adresse refusée pour de
// bon est abandonnée ; des identifiants refusés arrêtent tout jusqu'à ce que le fichier de la boîte soit corrigé.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerProchainEssai } from "../../fonctions/courriels/calculer-prochain-essai.ts";
import { classerErreurEnvoi } from "../../fonctions/courriels/classer-erreur-envoi.ts";
import { ajouterLienDesinscription } from "../../fonctions/courriels/ajouter-lien-desinscription.ts";
import { lireListeInscrits } from "../gestion/boite-mail.ts";
import { creerAdresseDesinscriptionUnClic, creerLienDesinscription } from "../liens-desinscription.ts";
import { expedierCourriel, type ExpedierCourriel, type MessageCourriel } from "./expedier-courriel.ts";
import { lireReglagesEnvoi, type EtatReglagesEnvoi } from "./reglages-envoi.ts";
import { annoncerRelance, arreterAnnonceRelance, creerRelancesEnvois, estAnnonceDeRelance, prochaineRelance } from "./relances-envois.ts";

const UNE_HEURE = 3600_000;
/** Au plus tant de mails par passage (toutes les 20 s), même si la limite horaire le permettrait */
const PAR_PASSAGE = 20;
/** Le journal des envois (adresse, date, résultat) est effacé après 90 jours */
const CONSERVATION = 90 * 24 * UNE_HEURE;

export type ContenuEnvoi = { objet: string; html: string; texte: string };

/** Problème de réglages vu au dernier passage (identifiants refusés…), effacé au premier envoi réussi */
let problemeReglages: { message: string; moment: Date } | null = null;
let passageEnCours = false;
const DEMARRAGE = new Date();
let relancesCoupeesMarquees = false;

/** Ce qu'on peut garder d'une erreur de serveur mail : sa réponse (« 550 … »), jamais le contenu du mail. */
function decrireErreur(erreur: unknown): string {
  const { response, code, message } = (erreur ?? {}) as { response?: string; code?: string; message?: string };
  return String(response || `${code ?? "erreur"} ${message ?? ""}`).replace(/\s+/g, " ").trim().slice(0, 300);
}

const relances = creerRelancesEnvois({
  decrire: decrireErreur,
  noter: async (id, { envoye, essais, erreur }) => {
    await baseDeDonnees.envoiCourriel.update({ where: { id }, data: envoye ? { statut: "envoye", envoyeLe: new Date(), essais, erreur: null } : { essais, erreur } });
    if (envoye) problemeReglages = null;
  },
});

async function marquerRelancesCoupees(maintenant: Date) {
  const lignes = await baseDeDonnees.envoiCourriel.findMany({
    where: { statut: "echec", creeLe: { gte: new Date(maintenant.getTime() - UNE_HEURE), lt: DEMARRAGE }, erreur: { contains: "nouvel essai à" } },
    select: { id: true, erreur: true },
  });
  for (const ligne of lignes) {
    if (estAnnonceDeRelance(ligne.erreur)) await baseDeDonnees.envoiCourriel.update({ where: { id: ligne.id }, data: { erreur: arreterAnnonceRelance(ligne.erreur!) } });
  }
}

/** Met un mail dans la file : il part au prochain passage (dans 20 secondes au plus, selon la limite horaire). */
export async function mettreEnFile(type: string, destinataire: string, contenu: ContenuEnvoi) {
  return baseDeDonnees.envoiCourriel.create({ data: { type, destinataire: destinataire.trim().toLowerCase(), ...contenu } });
}

type Dependances = { expedier?: ExpedierCourriel; lireReglages?: () => Promise<EtatReglagesEnvoi>; maintenant?: Date };

/** Un passage : envoie les mails dus, dans la limite horaire. Rend le nombre de mails partis. */
export async function traiterFileCourriels({ expedier = expedierCourriel, lireReglages = lireReglagesEnvoi, maintenant = new Date() }: Dependances = {}) {
  if (passageEnCours) return 0;
  passageEnCours = true;
  try {
    if (!relancesCoupeesMarquees) {
      relancesCoupeesMarquees = true;
      await marquerRelancesCoupees(maintenant).catch(() => {});
    }
    const { reglages } = await lireReglages();
    if (!reglages) return 0;
    const dejaEnvoyes = await baseDeDonnees.envoiCourriel.count({ where: { statut: "envoye", envoyeLe: { gte: new Date(maintenant.getTime() - UNE_HEURE) } } });
    const budget = Math.min(reglages.parHeure - dejaEnvoyes, PAR_PASSAGE);
    if (budget <= 0) return 0;
    const dus = await baseDeDonnees.envoiCourriel.findMany({
      where: { statut: "en-attente", prochainEssai: { lte: maintenant } },
      orderBy: [{ prochainEssai: "asc" }, { id: "asc" }],
      take: budget,
      include: { campagne: { select: { objet: true, html: true, texte: true, public: true } } },
    });
    if (dus.length === 0) return 0;
    // Envoi groupé : on revérifie le public juste avant l'envoi (une désinscription ou un départ entre-temps est respecté)
    const liste = dus.some((envoi) => envoi.campagne?.public === "newsletter")
      ? new Set((await lireListeInscrits())?.map((inscrit) => inscrit.adresse) ?? [])
      : null;
    const ambassadeurs = dus.some((envoi) => envoi.campagne?.public === "ambassadeurs")
      ? new Set((await baseDeDonnees.compte.findMany({ where: { ambassadeur: { is: { statut: { not: "refuse" } } } }, select: { email: true } })).map((c) => c.email))
      : null;

    const comptes = dus.some((envoi) => envoi.campagne?.public === "comptes")
      ? new Set((await baseDeDonnees.compte.findMany({ select: { email: true } })).map((c) => c.email))
      : null;

    let partis = 0;
    for (const envoi of dus) {
      const publicCampagne = envoi.campagne?.public;
      const toujoursLa = publicCampagne === "ambassadeurs" ? ambassadeurs?.has(envoi.destinataire)
        : publicCampagne === "comptes" ? comptes?.has(envoi.destinataire) : liste?.has(envoi.destinataire);
      if (envoi.campagne && !toujoursLa) {
        const raison = publicCampagne === "ambassadeurs" ? "N'est plus ambassadeur" : publicCampagne === "comptes" ? "Compte supprimé entre-temps" : "Plus dans la liste (désinscription)";
        await baseDeDonnees.envoiCourriel.update({ where: { id: envoi.id }, data: { statut: "annule", erreur: raison } });
        continue;
      }
      const newsletter = envoi.campagne?.public === "newsletter";
      // Newsletter : le lien « Me désinscrire » de cette personne en bas du mail, et la désinscription en un clic des messageries
      const lien = newsletter ? creerLienDesinscription(envoi.destinataire) : null;
      const base = envoi.campagne
        ? { objet: envoi.campagne.objet, html: envoi.campagne.html, texte: envoi.campagne.texte }
        : { objet: envoi.objet ?? "", html: envoi.html ?? "", texte: envoi.texte ?? "" };
      const contenu = lien ? { ...base, ...ajouterLienDesinscription(base, lien) } : base;
      try {
        await expedier(reglages, {
          a: envoi.destinataire, ...contenu, newsletter, sansCopie: Boolean(envoi.campagne),
          desinscriptionUnClic: newsletter ? creerAdresseDesinscriptionUnClic(envoi.destinataire) : null,
        });
        // Parti : le contenu n'a plus à être gardé (l'objet reste, pour le journal)
        await baseDeDonnees.envoiCourriel.update({
          where: { id: envoi.id },
          data: { statut: "envoye", envoyeLe: new Date(), essais: envoi.essais + 1, html: null, texte: null, erreur: null },
        });
        problemeReglages = null;
        partis++;
      } catch (erreur) {
        const suite = classerErreurEnvoi(erreur as { code?: string; responseCode?: number; command?: string });
        const message = decrireErreur(erreur);
        if (suite === "configuration") {
          // Les réglages sont faux : ce mail (et les suivants) attendent qu'ils soient corrigés
          problemeReglages = { message, moment: maintenant };
          await baseDeDonnees.envoiCourriel.update({ where: { id: envoi.id }, data: { erreur: message, prochainEssai: new Date(maintenant.getTime() + 15 * 60_000) } });
          break;
        }
        const essais = envoi.essais + 1;
        const prochainEssai = suite === "reessayer" ? calculerProchainEssai(essais, maintenant) : null;
        await baseDeDonnees.envoiCourriel.update({
          where: { id: envoi.id },
          data: prochainEssai ? { essais, prochainEssai, erreur: message } : { essais, statut: "echec", erreur: message, html: null, texte: null },
        });
      }
    }
    return partis;
  } finally {
    passageEnCours = false;
  }
}

/** Envoie tout de suite, sans passer par la file (essai, lien de mot de passe) ; le journal ne garde que l'objet. */
export async function envoyerToutDeSuite(
  type: string,
  destinataire: string,
  contenu: ContenuEnvoi & Pick<MessageCourriel, "ecritALaMain" | "enReponseA" | "secrets"> & { relancer?: boolean },
  expedier: ExpedierCourriel = expedierCourriel,
) {
  const { relancer, ...message } = contenu;
  const adresse = destinataire.trim().toLowerCase();
  const cle = `${type}|${adresse}`;
  relances.annuler(cle);
  const { etat, reglages } = await lireReglagesEnvoi();
  if (!reglages) return { ok: false as const, erreur: `envoi-${etat}` };
  try {
    await expedier(reglages, { a: destinataire, ...message });
  } catch (erreur) {
    const texte = decrireErreur(erreur);
    const suite = classerErreurEnvoi(erreur as { code?: string; responseCode?: number; command?: string });
    if (suite === "configuration") problemeReglages = { message: texte, moment: new Date() };
    const prochainLe = relancer && suite === "reessayer" ? prochaineRelance(1, Date.now()) : null;
    const ligne = await baseDeDonnees.envoiCourriel
      .create({ data: { type, destinataire: adresse, objet: message.objet, statut: "echec", essais: 1, erreur: annoncerRelance(texte, prochainLe) } })
      .catch(() => null);
    if (prochainLe !== null) {
      relances.programmer({
        cle, id: ligne?.id ?? null, essai: 1,
        tenter: async () => {
          const actuels = await lireReglagesEnvoi();
          if (!actuels.reglages) throw Object.assign(new Error(`envoi-${actuels.etat}`), { code: "ESANSREGLAGES" });
          await expedier(actuels.reglages, { a: destinataire, ...message });
        },
      });
    }
    return { ok: false as const, erreur: "envoi-refuse", message: texte };
  }
  problemeReglages = null;
  await baseDeDonnees.envoiCourriel.create({ data: { type, destinataire: adresse, objet: message.objet, statut: "envoye", essais: 1, envoyeLe: new Date() } });
  return { ok: true as const };
}

/** L'état de l'envoi, pour le logiciel de gestion. */
export async function lireEtatEnvois(maintenant = new Date()) {
  const { etat, reglages } = await lireReglagesEnvoi();
  const [enAttente, derniereHeure, echecs, dernierEnvoi] = await Promise.all([
    baseDeDonnees.envoiCourriel.count({ where: { statut: "en-attente" } }),
    baseDeDonnees.envoiCourriel.count({ where: { statut: "envoye", envoyeLe: { gte: new Date(maintenant.getTime() - UNE_HEURE) } } }),
    baseDeDonnees.envoiCourriel.count({ where: { statut: "echec", creeLe: { gte: new Date(maintenant.getTime() - 7 * 24 * UNE_HEURE) } } }),
    baseDeDonnees.envoiCourriel.findFirst({ where: { statut: "envoye" }, orderBy: { envoyeLe: "desc" }, select: { envoyeLe: true } }),
  ]);
  return {
    reglages: etat,
    expediteur: reglages ? `${reglages.nomExpediteur} <${reglages.utilisateur}>` : null,
    serveur: reglages ? `${reglages.serveur}:${reglages.port}` : null,
    parHeure: reglages?.parHeure ?? null,
    enAttente,
    derniereHeure,
    echecs7Jours: echecs,
    dernierEnvoi: dernierEnvoi?.envoyeLe ?? null,
    probleme: problemeReglages,
  };
}

/** Les derniers envois (hors newsletter, qui a son propre suivi), pour le logiciel. */
export async function listerDerniersEnvois() {
  return baseDeDonnees.envoiCourriel.findMany({
    where: { campagneId: null },
    orderBy: { creeLe: "desc" },
    take: 50,
    select: { id: true, type: true, destinataire: true, objet: true, statut: true, essais: true, erreur: true, creeLe: true, envoyeLe: true },
  });
}

/** Ménage de nuit : le journal des envois de plus de 90 jours part (le contenu des newsletters, lui, reste). */
export async function effacerEnvoisAnciens(maintenant = new Date()) {
  const { count } = await baseDeDonnees.envoiCourriel.deleteMany({ where: { statut: { not: "en-attente" }, creeLe: { lt: new Date(maintenant.getTime() - CONSERVATION) } } });
  return count;
}
