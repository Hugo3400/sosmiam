// Infos pratiques des lieux d'exemple (lieux inventés, voir lieux-exemples.ts). Les numéros sont pris dans la tranche
// que l'ARCEP réserve à la fiction (04 65 71 xx xx) : on ne peut jamais appeler un vrai commerce par erreur. Les sites
// utilisent example.com, domaine réservé aux exemples. Pas de compte Instagram inventé : il pourrait exister.
import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";

export const infosPratiquesExemples: Readonly<Record<number, InfosPratiques>> = {
  0: { telephone: "04 65 71 00 01", siteWeb: "https://example.com/chez-nonna-lia", animaux: "terrasse", accessible: true, terrasse: true, enfants: true, paiements: ["cb", "sans-contact", "tickets-resto"], reservation: "conseillee" },
  1: { telephone: "04 65 71 00 02", animaux: "non", accessible: true, paiements: ["cb", "sans-contact", "especes"], reservation: "inutile" },
  2: { telephone: "04 65 71 00 03", animaux: "bienvenus", terrasse: true, wifi: true, paiements: ["cb", "sans-contact", "especes"], reservation: "inutile" },
  3: { telephone: "04 65 71 00 04", animaux: "non", accessible: true, paiements: ["cb", "sans-contact", "tickets-resto"], reservation: "inutile" },
  4: { telephone: "04 65 71 00 05", animaux: "non", paiements: ["cb", "especes"], reservation: "inutile" },
  5: { telephone: "04 65 71 00 06", animaux: "bienvenus", terrasse: true, paiements: ["cb", "sans-contact"], reservation: "conseillee" },
  6: { telephone: "04 65 71 00 07", siteWeb: "https://example.com/pagaies-du-lez", animaux: "non", parking: true, enfants: true, paiements: ["cb", "especes", "cheques-vacances"], reservation: "obligatoire" },
  7: { telephone: "04 65 71 00 08", animaux: "non", accessible: true, paiements: ["cb", "sans-contact", "cheques-vacances"], reservation: "obligatoire" },
  8: { telephone: "04 65 71 00 09", animaux: "non", enfants: true, paiements: ["cb", "especes"], reservation: "obligatoire" },
  9: { telephone: "04 65 71 00 10", animaux: "terrasse", terrasse: true, paiements: ["cb", "especes", "tickets-resto"], reservation: "inutile" },
  18: { telephone: "04 65 71 00 19", siteWeb: "https://example.com/capitaine-bouiboui", instagram: "official.sosmiam", animaux: "bienvenus", accessible: true, terrasse: true, wifi: true, enfants: true, paiements: ["cb", "sans-contact", "especes", "tickets-resto"], reservation: "conseillee" },
  10: { telephone: "04 65 71 00 11", animaux: "non", paiements: ["cb", "especes"], reservation: "inutile" },
  11: { telephone: "04 65 71 00 12", animaux: "non", accessible: true, paiements: ["cb", "sans-contact", "especes"], reservation: "inutile" },
  12: { telephone: "04 65 71 00 13", animaux: "non", parking: true, enfants: true, paiements: ["cb", "cheques-vacances"], reservation: "obligatoire" },
  13: { telephone: "04 65 71 00 14", animaux: "bienvenus", terrasse: true, parking: true, enfants: true, paiements: ["cb", "sans-contact", "tickets-resto"], reservation: "conseillee" },
  14: { telephone: "04 65 71 00 15", animaux: "bienvenus", terrasse: true, wifi: true, paiements: ["cb", "sans-contact", "especes"], reservation: "inutile" },
  15: { telephone: "04 65 71 00 16", animaux: "non", paiements: ["cb", "especes"], reservation: "inutile" },
  16: { telephone: "04 65 71 00 17", animaux: "terrasse", accessible: true, terrasse: true, enfants: true, paiements: ["cb", "sans-contact", "tickets-resto", "cheques-vacances"], reservation: "conseillee" },
  17: { telephone: "04 65 71 00 18", animaux: "bienvenus", terrasse: true, parking: true, paiements: ["cb", "sans-contact", "especes"], reservation: "inutile" },
};
