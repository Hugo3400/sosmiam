import type { AvisPublic, NoteAvis } from "@sos-miam/commun/types/avis";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";
import type { ModeValidation, ReglementVisite, Visite } from "@sos-miam/commun/types/visite";

import type { SourcePhotoAvis } from "~/composants/avis/BlocPhotoAvis";

export type CasExempleDonnerAvis = "verifie" | "offert" | "bar" | "retouche" | "limite" | "deja-donne" | "ferme" | "pas-ouvert";

export type SaisieAvisExemple = { note: NoteAvis | null; texte: string; photo: SourcePhotoAvis | null };

export type ExempleTemporaireDonnerAvis = {
  libelle: string;
  visite: Visite;
  prenom: string;
  signature: string;
  photoAjoutee: SourcePhotoAvis;
  pointsPhoto: number;
  saisieDeDepart: SaisieAvisExemple;
  refusOuverture: ErreurService | null;
  refusEnvoi: "avis-invalide" | "compte-limite" | null;
};

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;
const DEPART = Date.now();

const ilYa = (duree: number) => new Date(DEPART - duree).toISOString();

const PHOTO_HUITRES: SourcePhotoAvis = require("../../assets/medias-demo/lieu-13-1.jpg");
const PHOTO_PATES: SourcePhotoAvis = require("../../assets/medias-demo/lieu-0-affiche.jpg");
const PHOTO_VERRE: SourcePhotoAvis = require("../../assets/medias-demo/lieu-5-affiche.jpg");

const CABANE_EMILE: LieuResume = { id: 13, nom: "La Cabane d'Émile", emoji: "🦪", type: "resto", ville: "Bouzigues" };
const NONNA_LIA: LieuResume = { id: 0, nom: "Chez Nonna Lia", emoji: "🍝", type: "resto", ville: "Montpellier" };
const VERRE_TORDU: LieuResume = { id: 5, nom: "Le Verre Tordu", emoji: "🍷", type: "bar", ville: "Montpellier" };

const PAYEE: ReglementVisite = { type: "paye", reductionPourcent: null, avantages: [] };
const OFFERTE: ReglementVisite = { type: "offert", reductionPourcent: null, avantages: [] };

const SAISIE_VIDE: SaisieAvisExemple = { note: null, texte: "", photo: null };

function creerVisiteExemple(id: number, lieu: LieuResume, mode: ModeValidation, reglement: ReglementVisite, valideeIlYa: number, avisDonne = false): Visite {
  const valideLe = ilYa(valideeIlYa);
  const offerte = reglement.type === "offert";
  return {
    id,
    lieu,
    mode,
    statut: "validee",
    code: null,
    creeLe: ilYa(valideeIlYa + 5 * MINUTE),
    expireLe: null,
    valideLe,
    decideLe: valideLe,
    pendantSos: false,
    points: offerte ? 0 : 15,
    tampon: !offerte,
    resultatPosition: null,
    motifRefus: null,
    contestee: false,
    avis: { ouvertLe: ilYa(valideeIlYa - HEURE), fermeLe: ilYa(valideeIlYa - 14 * JOUR), donne: avisDonne },
    annulableJusqua: null,
    reglement,
    demo: true,
  };
}

const COMMUN = { prenom: "Hugo", signature: "Hugo R.", refusOuverture: null, refusEnvoi: null } as const;

export const CAS_EXEMPLES_DONNER_AVIS: readonly CasExempleDonnerAvis[] = ["verifie", "offert", "bar", "retouche", "limite", "deja-donne", "ferme", "pas-ouvert"];

export const EXEMPLES_TEMPORAIRES_DONNER_AVIS: Readonly<Record<CasExempleDonnerAvis, ExempleTemporaireDonnerAvis>> = {
  verifie: {
    ...COMMUN,
    libelle: "Visite payée",
    visite: creerVisiteExemple(9001, CABANE_EMILE, "addition", PAYEE, 3 * HEURE),
    photoAjoutee: PHOTO_HUITRES,
    pointsPhoto: 10,
    saisieDeDepart: SAISIE_VIDE,
  },
  offert: {
    ...COMMUN,
    libelle: "Repas offert",
    visite: creerVisiteExemple(9002, NONNA_LIA, "comptoir", OFFERTE, JOUR),
    photoAjoutee: PHOTO_PATES,
    pointsPhoto: 0,
    saisieDeDepart: {
      note: 5,
      texte: "Lia nous a offert le dîner pour fêter les 10 ans du resto : cacio e pepe parfaites et tiramisu de compétition. Merci !",
      photo: PHOTO_PATES,
    },
  },
  bar: {
    ...COMMUN,
    libelle: "Un bar",
    visite: creerVisiteExemple(9003, VERRE_TORDU, "comptoir", PAYEE, 2 * JOUR),
    photoAjoutee: PHOTO_VERRE,
    pointsPhoto: 10,
    saisieDeDepart: SAISIE_VIDE,
  },
  retouche: {
    ...COMMUN,
    libelle: "Un mot qui ne passe pas",
    visite: creerVisiteExemple(9004, CABANE_EMILE, "addition", PAYEE, 5 * HEURE),
    photoAjoutee: PHOTO_HUITRES,
    pointsPhoto: 10,
    saisieDeDepart: { note: 1, texte: "Attente interminable et serveur franchement #@!%. Plus jamais.", photo: null },
    refusEnvoi: "avis-invalide",
  },
  limite: {
    ...COMMUN,
    libelle: "Compte limité",
    visite: creerVisiteExemple(9005, CABANE_EMILE, "addition", PAYEE, 6 * HEURE),
    photoAjoutee: PHOTO_HUITRES,
    pointsPhoto: 10,
    saisieDeDepart: {
      note: 4,
      texte: "Huîtres d'une fraîcheur folle, et Émile raconte son métier comme personne. Prévois un pull, ça souffle sur l'étang !",
      photo: PHOTO_HUITRES,
    },
    refusEnvoi: "compte-limite",
  },
  "deja-donne": {
    ...COMMUN,
    libelle: "Avis déjà donné",
    visite: creerVisiteExemple(9006, NONNA_LIA, "addition", PAYEE, 4 * JOUR, true),
    photoAjoutee: PHOTO_PATES,
    pointsPhoto: 10,
    saisieDeDepart: SAISIE_VIDE,
    refusOuverture: "avis-deja-donne",
  },
  ferme: {
    ...COMMUN,
    libelle: "Trop tard",
    visite: creerVisiteExemple(9007, CABANE_EMILE, "reservation", PAYEE, 15 * JOUR),
    photoAjoutee: PHOTO_HUITRES,
    pointsPhoto: 10,
    saisieDeDepart: SAISIE_VIDE,
    refusOuverture: "avis-ferme",
  },
  "pas-ouvert": {
    ...COMMUN,
    libelle: "Trop tôt",
    visite: creerVisiteExemple(9008, CABANE_EMILE, "addition", PAYEE, 20 * MINUTE),
    photoAjoutee: PHOTO_HUITRES,
    pointsPhoto: 10,
    saisieDeDepart: SAISIE_VIDE,
    refusOuverture: "avis-pas-ouvert",
  },
};

export function lireCasExempleDonnerAvis(apercu: string | undefined): CasExempleDonnerAvis {
  return CAS_EXEMPLES_DONNER_AVIS.find((cas) => cas === apercu) ?? "verifie";
}

export function construireAvisPublicExemple(exemple: ExempleTemporaireDonnerAvis, note: NoteAvis, saisie: SaisieAvisExemple): AvisPublic {
  const aujourdhui = new Date();
  const reglement = exemple.visite.reglement?.type ?? "paye";
  return {
    id: exemple.visite.id,
    note,
    texte: saisie.texte.trim(),
    photo: saisie.photo ? "photo-exemple.jpg" : null,
    signature: exemple.signature,
    preuve: exemple.visite.mode,
    mois: `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}`,
    reponseLieu: null,
    verifie: true,
    repasOffert: reglement === "offert",
    avecReduction: reglement === "reduction",
  };
}
