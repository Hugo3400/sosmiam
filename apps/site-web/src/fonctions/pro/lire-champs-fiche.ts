import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_FICHE_PRO_PAR_LANGUE } from "~/contenus/fiche-pro";
import type { AccueilAnimaux, ChampsFiche, MoyenPaiement, ReservationConseillee } from "~/types/pro";

type Resultat = {
  champs: ChampsFiche;
  /** « Pourquoi ? » : accompagne un nouveau nom ou une nouvelle adresse (vide : rien) */
  message: string;
  /** Le message de chaque champ à corriger, dans l'ordre du formulaire */
  erreurs: Record<string, string>;
  /** Ce qui avait été tapé, pour remettre le formulaire tel quel après un refus (cases : valeurs séparées par des virgules) */
  valeurs: Record<string, string>;
};

const ANIMAUX: AccueilAnimaux[] = ["bienvenus", "terrasse", "non"];
const PAIEMENTS: MoyenPaiement[] = ["cb", "sans-contact", "especes", "tickets-resto", "cheques-vacances"];
const RESERVATIONS: ReservationConseillee[] = ["inutile", "conseillee", "obligatoire"];
const OUI_NON = ["accessible", "terrasse", "wifi", "enfants", "parking"] as const;

/**
 * Lit et vérifie le formulaire de « Ma fiche » (mêmes limites que la table des lieux de l'API) : un texte vide devient
 * null (inconnu, jamais affiché), « oui » / « non » / rien deviennent true / false / null, et les choix inconnus sont
 * ignorés. Le compte Instagram est gardé sans « @ » ni adresse. Les messages d'erreur sont à passer par lierPonctuation.
 */
export function lireChampsFiche(formulaire: FormData, langue: Langue = LANGUE_PAR_DEFAUT): Resultat {
  const E = choisirTextes(TEXTES_FICHE_PRO_PAR_LANGUE, langue).erreurs;
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/[ \t]+/g, " ").trim();
  const texte = String(formulaire.get("texte") ?? "").replace(/\r\n/g, "\n").trim();
  const erreurs: Record<string, string> = {};
  const valeurs: Record<string, string> = {};
  for (const nom of ["nom", "adresse", "horaires", "telephone", "siteWeb", "instagram", "animaux", ...OUI_NON, "reservation"]) valeurs[nom] = lire(nom);
  valeurs.texte = texte;
  const message = String(formulaire.get("message") ?? "").trim();
  valeurs.message = message;
  // Dans l'ordre de la liste, pour comparer avec la fiche enregistrée
  const coches = formulaire.getAll("paiements").map(String);
  const paiements = PAIEMENTS.filter((code) => coches.includes(code));
  valeurs.paiements = paiements.join(",");

  if (valeurs.nom.length < 2 || valeurs.nom.length > 80) erreurs.nom = E.nom;
  if (valeurs.adresse.length > 160) erreurs.adresse = E.adresse;
  if (valeurs.horaires.length > 160) erreurs.horaires = E.horaires;
  if (texte.length > 1000) erreurs.texte = E.texte;
  if (message.length > 1000) erreurs.message = E.message;
  if (valeurs.telephone && !/^\+?[\d\s.()-]{6,30}$/.test(valeurs.telephone)) erreurs.telephone = E.telephone;
  if (valeurs.siteWeb && (!/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(valeurs.siteWeb) || valeurs.siteWeb.length > 200)) {
    erreurs.siteWeb = E.siteWeb;
  }
  const instagram = valeurs.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) erreurs.instagram = E.instagram;

  const ouiNon = (nom: string) => (valeurs[nom] === "oui" ? true : valeurs[nom] === "non" ? false : null);
  return {
    message,
    champs: {
      nom: valeurs.nom,
      adresse: valeurs.adresse || null,
      horaires: valeurs.horaires || null,
      texte: texte || null,
      telephone: valeurs.telephone || null,
      siteWeb: valeurs.siteWeb || null,
      instagram: instagram || null,
      animaux: ANIMAUX.includes(valeurs.animaux as AccueilAnimaux) ? (valeurs.animaux as AccueilAnimaux) : null,
      accessible: ouiNon("accessible"),
      terrasse: ouiNon("terrasse"),
      wifi: ouiNon("wifi"),
      enfants: ouiNon("enfants"),
      parking: ouiNon("parking"),
      paiements,
      reservation: RESERVATIONS.includes(valeurs.reservation as ReservationConseillee) ? (valeurs.reservation as ReservationConseillee) : null,
    },
    erreurs,
    valeurs,
  };
}
