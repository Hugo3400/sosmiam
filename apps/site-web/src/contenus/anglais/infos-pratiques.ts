import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_INFOS_PRATIQUES } from "~/contenus/infos-pratiques";

export const TEXTES_INFOS_PRATIQUES_ANGLAIS: Traduction<typeof TEXTES_INFOS_PRATIQUES> = {
  animaux: {
    bienvenus: "Pets welcome",
    terrasse: "Pets on the terrace only",
    non: "No pets",
  },
  paiement: {
    cb: "card",
    "sans-contact": "contactless",
    especes: "cash",
    "tickets-resto": "meal vouchers (titres-restaurant)",
    "cheques-vacances": "Chèques-Vacances (French holiday vouchers)",
  },
  reservation: {
    inutile: "No need to book",
    conseillee: "Booking recommended",
    obligatoire: "Booking required",
  },
  ouiNon: {
    accessible: { question: "Wheelchair accessible (entrance and dining room)", oui: "Wheelchair accessible", non: "Not wheelchair accessible" },
    terrasse: { question: "A terrace", oui: "Terrace", non: "No terrace" },
    wifi: { question: "Wi-Fi for customers", oui: "Wi-Fi", non: "No Wi-Fi" },
    enfants: { question: "A high chair or a kids' menu", oui: "High chair or kids' menu", non: "Nothing set up for little ones" },
    parking: { question: "Easy parking right nearby", oui: "Easy parking nearby", non: "No easy parking" },
  },
};
