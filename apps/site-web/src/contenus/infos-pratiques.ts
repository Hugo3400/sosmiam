// Libellés des infos pratiques d'un lieu (fiche publique /lieux/:id et « Ma fiche » de l'espace pro). Mêmes codes et mêmes
// mots que packages/commun/src/contenus/libelles-infos-pratiques.ts (fiche de l'app) : les changer des deux côtés.
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_INFOS_PRATIQUES_ANGLAIS } from "~/contenus/anglais/infos-pratiques";
import type { AccueilAnimaux, FichePro, MoyenPaiement, ReservationConseillee } from "~/types/pro";

export const TEXTES_INFOS_PRATIQUES = {
  animaux: {
    bienvenus: "Animaux bienvenus",
    terrasse: "Animaux en terrasse seulement",
    non: "Pas d'animaux",
  } satisfies Record<AccueilAnimaux, string>,
  paiement: {
    cb: "carte bancaire",
    "sans-contact": "sans contact",
    especes: "espèces",
    "tickets-resto": "tickets resto",
    "cheques-vacances": "chèques-vacances",
  } satisfies Record<MoyenPaiement, string>,
  reservation: {
    inutile: "Pas besoin de réserver",
    conseillee: "Réservation conseillée",
    obligatoire: "Réservation obligatoire",
  } satisfies Record<ReservationConseillee, string>,
  ouiNon: {
    accessible: { question: "Accessible en fauteuil roulant (entrée et salle)", oui: "Accessible en fauteuil roulant", non: "Pas accessible en fauteuil roulant" },
    terrasse: { question: "Une terrasse", oui: "Terrasse", non: "Pas de terrasse" },
    wifi: { question: "Du Wi-Fi pour les clients", oui: "Wi-Fi", non: "Pas de Wi-Fi" },
    enfants: { question: "Une chaise haute ou un menu enfant", oui: "Chaise haute ou menu enfant", non: "Pas d'équipement pour les petits" },
    parking: { question: "Un parking facile juste à côté", oui: "Parking facile à côté", non: "Pas de parking facile" },
  },
};

export const TEXTES_INFOS_PRATIQUES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INFOS_PRATIQUES>> = {
  fr: TEXTES_INFOS_PRATIQUES,
  en: TEXTES_INFOS_PRATIQUES_ANGLAIS,
};

export type ChampOuiNon = keyof typeof TEXTES_INFOS_PRATIQUES.ouiNon;

const EMOJIS_ANIMAUX: Record<AccueilAnimaux, string> = { bienvenus: "🐶", terrasse: "🐕", non: "🚫" };

export const EMOJIS_OUI_NON: Record<ChampOuiNon, string> = { accessible: "♿", terrasse: "☀️", wifi: "📶", enfants: "🧒", parking: "🅿️" };

export const LIBELLES_ANIMAUX: Record<AccueilAnimaux, { emoji: string; texte: string }> = {
  bienvenus: { emoji: EMOJIS_ANIMAUX.bienvenus, texte: TEXTES_INFOS_PRATIQUES.animaux.bienvenus },
  terrasse: { emoji: EMOJIS_ANIMAUX.terrasse, texte: TEXTES_INFOS_PRATIQUES.animaux.terrasse },
  non: { emoji: EMOJIS_ANIMAUX.non, texte: TEXTES_INFOS_PRATIQUES.animaux.non },
};

export const LIBELLES_PAIEMENT: Record<MoyenPaiement, string> = TEXTES_INFOS_PRATIQUES.paiement;

export const LIBELLES_RESERVATION: Record<ReservationConseillee, string> = TEXTES_INFOS_PRATIQUES.reservation;

/** Les infos en oui / non : ce que dit la fiche quand c'est oui (et quand c'est non). */
export const INFOS_OUI_NON: { champ: ChampOuiNon; emoji: string; question: string; oui: string; non: string }[] = (Object.keys(EMOJIS_OUI_NON) as ChampOuiNon[]).map(
  (champ) => ({ champ, emoji: EMOJIS_OUI_NON[champ], ...TEXTES_INFOS_PRATIQUES.ouiNon[champ] }),
);

/** Le nom de chaque champ de la fiche, pour les suggestions (« Horaires : avant → après »). */
export const NOMS_CHAMPS: Record<keyof FichePro, string> = {
  id: "Numéro",
  nom: "Nom",
  adresse: "Adresse",
  ville: "Ville",
  type: "Catégorie",
  emoji: "Emoji",
  info: "En quelques mots",
  quartier: "Quartier",
  statut: "Statut",
  horaires: "Horaires",
  texte: "Présentation",
  telephone: "Téléphone",
  siteWeb: "Site",
  instagram: "Instagram",
  animaux: "Animaux",
  accessible: "Accès en fauteuil",
  terrasse: "Terrasse",
  wifi: "Wi-Fi",
  enfants: "Chaise haute ou menu enfant",
  parking: "Parking",
  paiements: "Paiements",
  reservation: "Réservation",
  estVerifie: "Vérifié",
};
