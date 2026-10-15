// Les données d'exemple du banc : le profil du téléphone et celui du serveur, les avatars, l'état gardé de la synchro.
import { AVATAR_PAR_DEFAUT } from "../doublures/avatar-local.mjs";

/** Le profil du téléphone (avec un régime, qui ne part jamais) */
export const LOCAL = {
  prenom: "Hugo",
  pseudo: "bob",
  dateNaissance: "1995-01-01",
  ville: "Montpellier",
  envies: { lieux: ["cafes"], regimes: ["halal"] },
  creeLe: "2026-01-01T00:00:00.000Z",
};
/** Le même profil, vu par le serveur */
export const VU = {
  prenom: "Hugo",
  nom: null,
  pseudo: "bob",
  dateNaissance: "1995-01-01",
  ville: "Montpellier",
  envies: { lieux: ["cafes"] },
  avatar: null,
  prive: false,
  emailVerifie: true,
  age: 31,
};

export const DEFAUT = AVATAR_PAR_DEFAUT;
export const PIZZA = { type: "emoji", emoji: "🍕" };
export const TACO = { type: "emoji", emoji: "🌮" };
export const BURRITO = { type: "emoji", emoji: "🌯" };
export const GRENOUILLE = { type: "emoji", emoji: "🐸" };
export const TOQUE = { type: "miami", id: "toque" };
export const PHOTO_A = { type: "photo", uri: "file:///app/avatar-1.jpg" };
export const PHOTO_B = { type: "photo", uri: "file:///app/avatar-2.jpg" };
export const A_ENVOYER = { type: "photo", uri: "file:///app/avatar-3.jpg", partage: "a-envoyer" };
export const A_ENVOYER_B = { type: "photo", uri: "file:///app/avatar-4.jpg", partage: "a-envoyer" };
export const SUR_LE_SERVEUR = "photo:11111111-2222-4333-8444-555555555555.jpg";
export const EN_LIGNE = { type: "photo", uri: null, partage: SUR_LE_SERVEUR };

export const CLE_SYNCHRO = "sosmiam.synchro-profil";

/**
 * L'état gardé d'un téléphone qui a déjà fait sa première synchro (sans avatarServeur : version d'avant l'avatar), à
 * donner en `magasin` au montage ; `x` le complète
 */
export const etat = (x = {}) => [
  [CLE_SYNCHRO, JSON.stringify({ version: 1, premiereFaite: true, aEnvoyer: [], pseudoMisDeCote: null, annonce: null, luLe: 0, pseudoServeur: "bob", ...x })],
];

/** L'état de la synchro gardé sur le téléphone en ce moment (null : rien) */
export const lireEtatGarde = () => JSON.parse(globalThis.__magasin?.get(CLE_SYNCHRO) ?? "null");

/** Une décision de la modération qui vient de retenir ton profil */
export const decisionRetenue = () => ({
  id: "1",
  cible: "profil",
  role: "auteur",
  statut: "retenu",
  motif: null,
  motivation: null,
  decideLe: new Date().toISOString(),
  contestableJusqua: null,
  contestation: "aucune",
});
