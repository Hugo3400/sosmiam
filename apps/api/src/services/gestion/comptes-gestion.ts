// Tous les comptes SOS Miam dans le logiciel de gestion (un seul compte par personne pour l'app, l'espace ambassadeur et
// l'espace pro) : recherche, fiche, déconnexion partout, export des données (droit d'accès RGPD) et suppression.
// Jamais de mot de passe ni de jeton : ni dans la liste, ni dans la fiche, ni dans l'export.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import type { ChiffrementDonnees } from "../chiffrement-donnees.ts";
import { dechiffrerProfil } from "./profil-gestion.ts";

const PAR_PAGE = 50;

export type FiltresComptes = { recherche: string; role: "" | "ambassadeur" | "sans-role"; page: number };

export async function listerComptes({ recherche, role, page }: FiltresComptes) {
  const ou: Prisma.CompteWhereInput = {
    ...(role === "ambassadeur" ? { ambassadeur: { isNot: null } } : role === "sans-role" ? { ambassadeur: { is: null } } : {}),
    ...(recherche ? { OR: [{ prenom: { contains: recherche, mode: "insensitive" } }, { email: { contains: recherche, mode: "insensitive" } }] } : {}),
  };
  const [trouves, total, ambassadeurs, actifsSemaine, comptes] = await Promise.all([
    baseDeDonnees.compte.count({ where: ou }),
    baseDeDonnees.compte.count(),
    baseDeDonnees.compte.count({ where: { ambassadeur: { isNot: null } } }),
    baseDeDonnees.compte.count({ where: { derniereConnexion: { gte: new Date(Date.now() - 7 * 86_400_000) } } }),
    baseDeDonnees.compte.findMany({
      where: ou,
      orderBy: { creeLe: "desc" },
      skip: (Math.max(1, page) - 1) * PAR_PAGE,
      take: PAR_PAGE,
      select: {
        id: true, prenom: true, pseudo: true, ville: true, email: true, emailVerifieLe: true, points: true, palier: true, creeLe: true, derniereConnexion: true,
        ambassadeur: { select: { statut: true, ville: true } },
        _count: { select: { sessions: true } },
      },
    }),
  ]);
  return { total, trouves, parPage: PAR_PAGE, compteurs: { ambassadeurs, actifsSemaine }, comptes };
}

/** La fiche d'un compte : ce qu'on en sait, ses rôles et ses connexions ouvertes (par support : site, app). */
export async function lireCompteGestion(id: number) {
  const [compte, sessions] = await Promise.all([
    baseDeDonnees.compte.findUnique({
      where: { id },
      select: {
        id: true, prenom: true, pseudo: true, ville: true, prive: true, email: true, emailVerifieLe: true, points: true, palier: true, cguVersion: true, creeLe: true, modifieLe: true, derniereConnexion: true,
        // Jamais le nom ni la date de naissance (chiffrés) : seulement « renseignés ou non », pour le bouton « Afficher »
        dateNaissanceChiffree: true,
        ambassadeur: { select: { statut: true, ville: true, quartier: true, decideLe: true } },
        badges: { select: { badge: true, obtenuLe: true }, orderBy: { obtenuLe: "asc" } },
        journalPoints: { select: { points: true, raison: true, detail: true, creeLe: true }, orderBy: { creeLe: "desc" }, take: 20 },
        _count: { select: { demandesLieux: true, missions: true, candidatures: true } },
      },
    }),
    baseDeDonnees.sessionCompte.groupBy({ by: ["support"], where: { compteId: id }, _count: { _all: true }, _max: { activite: true } }),
  ]);
  if (!compte) return null;
  const { dateNaissanceChiffree, ...visible } = compte;
  return { ...visible, dateNaissanceRenseignee: Boolean(dateNaissanceChiffree), sessions: sessions.map((s) => ({ support: s.support, nombre: s._count._all, derniereActivite: s._max.activite })) };
}

/** Ferme toutes les connexions du compte (site et app) : il devra se reconnecter. Rend le nombre de sessions fermées. */
export async function deconnecterPartout(id: number) {
  const { count } = await baseDeDonnees.sessionCompte.deleteMany({ where: { compteId: id } });
  return count;
}

/**
 * Toutes les données d'un compte, pour répondre à une demande d'accès (RGPD, article 15) : en JSON lisible, sans
 * empreinte de mot de passe ni jeton. La note de l'équipe en fait partie (la politique le promet), et le nom et la date de
 * naissance y sont EN CLAIR (déchiffrés ici, jamais gardés ainsi).
 */
export async function exporterDonneesCompte(id: number, chiffrement: ChiffrementDonnees) {
  const compte = await baseDeDonnees.compte.findUnique({
    where: { id },
    select: {
      id: true, email: true, emailVerifieLe: true, prenom: true, pseudo: true, ville: true, envies: true, avatar: true, prive: true,
      nomChiffre: true, dateNaissanceChiffree: true,
      // Connexion avec Apple ou Google : seulement « oui » ou « non », jamais l'identifiant lui-même
      appleSub: true, googleSub: true,
      points: true, palier: true, cguVersion: true, creeLe: true, modifieLe: true, derniereConnexion: true,
      ambassadeur: { select: { statut: true, ville: true, quartier: true, noteEquipe: true, decideLe: true, creeLe: true, certifieLe: true, profilCertifie: true, structure: true } },
      sessions: { select: { support: true, creeLe: true, activite: true } },
      badges: { select: { badge: true, obtenuLe: true } },
      journalPoints: { select: { points: true, raison: true, detail: true, creeLe: true }, orderBy: { creeLe: "asc" } },
      candidatures: { select: { pepites: true, envies: true, reseaux: true, motivation: true, partantRencontre: true, connuPar: true, statut: true, communeCode: true, zoneCode: true, numeroLocal: true, numeroNational: true, creeLe: true, reponduLe: true } },
      demandesLieux: { select: { nom: true, ville: true, adresse: true, description: true, statut: true, creeLe: true } },
      missions: { select: { titre: true, detail: true, echeance: true, statut: true, compteRendu: true, creeLe: true, faiteLe: true } },
      messages: { select: { titre: true, texte: true, creeLe: true } },
      candidaturesCertification: { select: { profil: true, structure: true, communeCode: true, aide: true, envies: true, engagementGratuit: true, statut: true, creeLe: true, reponduLe: true } },
      suggestionsLieux: { select: { lieuId: true, source: true, proposition: true, message: true, statut: true, reponse: true, creeLe: true, decideLe: true } },
      lectures: { select: { messageId: true, luLe: true } },
      // Activité de l'app (visites, fidélité, Miam Safe…) : tout ce qui la concerne, sauf les secrets techniques (jeton d'un
      // téléphone, code d'une visite) et la note interne de l'équipe sur un signalement (elle porte sur le lieu)
      appareils: { select: { plateforme: true, ville: true, actif: true, creeLe: true, vuLe: true } },
      visites: { select: { lieuId: true, mode: true, statut: true, creeLe: true, valideLe: true, pendantSos: true, points: true, tampon: true, motifRefus: true, contestee: true, contestation: true, avisDonne: true } },
      visitesDecidees: { select: { lieuId: true, statut: true, decideLe: true } },
      rescousses: { select: { lieuId: true, semaine: true, creeLe: true } },
      premiersSauvetages: { select: { lieuId: true, creeLe: true } },
      lieuxGardes: { select: { lieuId: true, creeLe: true } },
      jaimesPublications: { select: { publicationId: true, creeLe: true } },
      publicationsMasquees: { select: { publicationId: true, creeLe: true } },
      suivisLieux: { select: { lieuId: true, creeLe: true } },
      suivisCreateurs: { select: { pseudo: true, creeLe: true } },
      presentationsQr: { select: { lieuId: true, personnes: true, reglement: true, creeLe: true } },
      cartesFidelite: { select: { lieuId: true, tampons: true, creeLe: true, pretes: { select: { libelle: true, gagneeLe: true, offerteLe: true } }, demandes: { select: { recompenseId: true, creeLe: true, expireLe: true } } } },
      recompensesOffertes: { select: { libelle: true, offerteLe: true } },
      sosLances: { select: { lieuId: true, places: true, jusqua: true, offre: true, creeLe: true, arreteLe: true } },
      reponsesSentiBien: { select: { lieuId: true, oui: true, modifieLe: true } },
      alertesMiamSafe: { select: { lieuId: true, prenom: true, endroit: true, detail: true, creeLe: true, repondueLe: true } },
      alertesMiamSafeRepondues: { select: { lieuId: true, repondueLe: true } },
      signalementsMiamSafe: { select: { lieuId: true, raison: true, explication: true, statut: true, creeLe: true, traiteLe: true } },
      chartesMiamSafe: { select: { lieuId: true, signeeLe: true, retireeLe: true } },
      rattachementsLieux: { select: { lieuId: true, role: true, preuve: true, siret: true, statut: true, reponse: true, creeLe: true, decideLe: true } },
    },
  });
  if (!compte) return null;
  const mails = await baseDeDonnees.envoiCourriel.findMany({
    where: { destinataire: compte.email },
    select: { type: true, objet: true, statut: true, creeLe: true, envoyeLe: true },
    orderBy: { creeLe: "asc" },
  });
  const { nomChiffre, dateNaissanceChiffree, appleSub, googleSub, ...reste } = compte;
  return {
    exporteLe: new Date().toISOString(),
    compte: {
      ...reste,
      ...dechiffrerProfil(chiffrement, { nomChiffre, dateNaissanceChiffree }),
      connecteAvecApple: appleSub ? "oui" : "non",
      connecteAvecGoogle: googleSub ? "oui" : "non",
    },
    mailsEnvoyes: mails,
  };
}
