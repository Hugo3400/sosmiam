// DONNÉES D'EXEMPLE de l'espace pro, pour le SERVEUR DE DÉVELOPPEMENT SEULEMENT, tant que les routes /pro/… de l'API
// n'existent pas. services/pro.server.ts ne les lit que si import.meta.env.DEV est vrai : en ligne, jamais. Les lieux sont
// marqués « (exemple) », avec des ids hors des vrais (9001…), des numéros de la tranche que l'ARCEP réserve à la fiction
// (04 65 71 xx xx) et des sites en example.com (docs/decisions.md, « Infos pratiques des lieux »).
import type { FichePro, FichePublique, LieuDuCompte, LieuTrouve, MembreEquipe, SuggestionFiche } from "~/types/pro";

/** Les lieux du compte connecté : un vérifié, une demande en attente, une invitation à rejoindre une équipe. */
export const LIEUX_COMPTE_EXEMPLE: LieuDuCompte[] = [
  { lieuId: 9001, nom: "Chez Jo (exemple)", ville: "Montpellier", role: "gerant", statut: "valide", rattachementId: 1 },
  { lieuId: 9002, nom: "La Fournée d'exemple", ville: "Sète", role: "gerant", statut: "en-attente", rattachementId: 2 },
  { lieuId: 9003, nom: "Le Bowling d'exemple", ville: "Lunel", role: "equipe", statut: "en-attente", rattachementId: 3 },
];

/** Ce que trouve « Chercher mon lieu ». */
export const LIEUX_TROUVES_EXEMPLE: LieuTrouve[] = [
  { id: 9001, nom: "Chez Jo (exemple)", ville: "Montpellier", categorie: "resto" },
  { id: 9002, nom: "La Fournée d'exemple", ville: "Sète", categorie: "patisserie" },
  { id: 9003, nom: "Le Bowling d'exemple", ville: "Lunel", categorie: "sortie" },
  { id: 9004, nom: "Le Comptoir d'exemple", ville: "Montpellier", categorie: "bar" },
];

const FICHES: Record<number, FichePro> = {
  9001: {
    id: 9001, nom: "Chez Jo (exemple)", adresse: "12 rue de l'Exemple", ville: "Montpellier", categorie: "resto",
    horaires: "Mar–sam, 12h–14h30 et 19h–23h",
    texte: "Une petite trattoria de quartier : pâtes fraîches du jour, tiramisu maison et une terrasse à l'ombre des platanes.",
    telephone: "04 65 71 00 12", siteWeb: "https://example.com", instagram: null,
    animaux: "terrasse", accessible: true, terrasse: true, wifi: null, enfants: true, parking: null,
    paiements: ["cb", "sans-contact", "tickets-resto"], reservation: "conseillee", estVerifie: true,
  },
  9002: {
    id: 9002, nom: "La Fournée d'exemple", adresse: null, ville: "Sète", categorie: "patisserie",
    horaires: null, texte: null, telephone: null, siteWeb: null, instagram: null,
    animaux: null, accessible: null, terrasse: null, wifi: null, enfants: null, parking: null, paiements: [], reservation: null, estVerifie: false,
  },
  9003: {
    id: 9003, nom: "Le Bowling d'exemple", adresse: "3 avenue de l'Exemple", ville: "Lunel", categorie: "sortie",
    horaires: "Tous les jours, 14h–1h", texte: "Douze pistes, des frites qui croustillent et une ambiance de folie le vendredi.",
    telephone: "04 65 71 00 34", siteWeb: null, instagram: null,
    animaux: "non", accessible: true, terrasse: false, wifi: true, enfants: true, parking: true,
    paiements: ["cb", "especes", "cheques-vacances"], reservation: "inutile", estVerifie: true,
  },
};

/** La fiche d'un lieu d'exemple, ou null. */
export function lireFicheExemple(id: number): FichePro | null {
  return FICHES[id] ?? null;
}

/** La fiche publique d'un lieu d'exemple (9001 vérifié, 9002 non vérifié), ou null. */
export function lireFichePubliqueExemple(id: number): FichePublique | null {
  const fiche = FICHES[id];
  if (!fiche) return null;
  return { ...fiche, info: fiche.categorie === "resto" ? "Trattoria" : null, quartier: id === 9001 ? "Beaux-Arts" : null, decouvertPar: id === 9001 ? "Camille" : null };
}

export const SUGGESTIONS_EXEMPLE: SuggestionFiche[] = [
  {
    id: 41, source: "client", statut: "en-attente", creeLe: "2026-10-08T18:20:00Z", decideLe: null,
    message: "Vous fermez à 22h30 le dimanche maintenant, non ?",
    champs: [{ champ: "horaires", avant: "Mar–sam, 12h–14h30 et 19h–23h", apres: "Mar–dim, 12h–14h30 et 19h–22h30" }],
  },
  {
    id: 37, source: "client", statut: "partielle", creeLe: "2026-10-02T09:05:00Z", decideLe: "2026-10-03T16:40:00Z", message: null,
    champs: [
      { champ: "terrasse", avant: null, apres: true },
      { champ: "wifi", avant: null, apres: true },
    ],
  },
  {
    id: 30, source: "pro", statut: "acceptee", creeLe: "2026-09-28T11:00:00Z", decideLe: "2026-09-29T08:30:00Z", message: "Nouvelle adresse depuis septembre.",
    champs: [{ champ: "adresse", avant: "10 rue de l'Exemple", apres: "12 rue de l'Exemple" }],
  },
  {
    id: 22, source: "client", statut: "refusee", creeLe: "2026-09-20T20:12:00Z", decideLe: "2026-09-21T10:00:00Z", message: null,
    champs: [{ champ: "paiements", avant: ["cb"], apres: ["cb", "cheques-vacances"] }],
  },
];

export const EQUIPE_EXEMPLE: MembreEquipe[] = [
  { compteId: 501, prenom: "Lina", statut: "valide" },
  { compteId: 502, prenom: "Malo", statut: "en-attente" },
];
