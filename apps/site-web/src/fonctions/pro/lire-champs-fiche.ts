import type { AccueilAnimaux, FichePro, MoyenPaiement, ReservationConseillee } from "~/types/pro";

/** Ce que « Ma fiche » envoie, une fois lu et vérifié. */
type ChampsFiche = Pick<FichePro, "nom" | "adresse" | "horaires" | "texte" | "telephone" | "siteWeb" | "instagram" | "animaux" | "accessible"
  | "terrasse" | "wifi" | "enfants" | "parking" | "paiements" | "reservation">;

type Resultat = {
  champs: ChampsFiche;
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
 * ignorés. Le compte Instagram est gardé sans « @ » ni adresse.
 */
export function lireChampsFiche(formulaire: FormData): Resultat {
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/[ \t]+/g, " ").trim();
  const texte = String(formulaire.get("texte") ?? "").replace(/\r\n/g, "\n").trim();
  const erreurs: Record<string, string> = {};
  const valeurs: Record<string, string> = {};
  for (const nom of ["nom", "adresse", "horaires", "telephone", "siteWeb", "instagram", "animaux", ...OUI_NON, "reservation"]) valeurs[nom] = lire(nom);
  valeurs.texte = texte;
  const paiements = formulaire.getAll("paiements").map(String).filter((code): code is MoyenPaiement => PAIEMENTS.includes(code as MoyenPaiement));
  valeurs.paiements = paiements.join(",");

  if (valeurs.nom.length < 2 || valeurs.nom.length > 80) erreurs.nom = "Le nom fait entre 2 et 80 caractères.";
  if (valeurs.adresse.length > 160) erreurs.adresse = "L'adresse fait 160 caractères au plus.";
  if (valeurs.horaires.length > 160) erreurs.horaires = "Les horaires font 160 caractères au plus : résume, les gourmands comprendront.";
  if (texte.length > 1000) erreurs.texte = "La présentation fait 1 000 caractères au plus.";
  if (valeurs.telephone && !/^\+?[\d\s.()-]{6,30}$/.test(valeurs.telephone)) erreurs.telephone = "Ce numéro ne semble pas valide (chiffres et espaces : 04 67 12 34 56).";
  if (valeurs.siteWeb && (!/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(valeurs.siteWeb) || valeurs.siteWeb.length > 200)) {
    erreurs.siteWeb = "Écris l'adresse complète du site, avec https:// (200 caractères au plus).";
  }
  const instagram = valeurs.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) erreurs.instagram = "Juste le nom du compte, sans « @ » : chezjo.montpellier.";

  const ouiNon = (nom: string) => (valeurs[nom] === "oui" ? true : valeurs[nom] === "non" ? false : null);
  return {
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
