import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { lieuDemoPro } from "~/contenus/lieu-demo-pro";

export const MIAMIS_EXEMPLES = {
  lea: { id: "lea", pseudo: "lea.croque", prenom: "Léa", avatar: "🦊" },
  nina: { id: "miami-nina", pseudo: "nina.miam", prenom: "Nina", avatar: "miami:chantilly" },
  yanis: { id: "miami-yanis", pseudo: "yanis.bao", prenom: "Yanis", avatar: "miami:bob" },
  alex: { id: "miami-alex", pseudo: "alex.pasta", prenom: "Alex", avatar: "miami:toque" },
  malo: { id: "miami-malo", pseudo: "malo.galette", prenom: "Malo", avatar: "miami:galette" },
  zoe: { id: "miami-zoe", pseudo: "zoe.gourmande", prenom: "Zoé", avatar: "miami:beret" },
  sam: { id: "miami-sam", pseudo: "sam.frites", prenom: "Sam", avatar: "miami:moustache" },
  jo: { id: "miami-jo", pseudo: "jo.ramen", prenom: "Jo", avatar: "miami:tuba" },
  lou: { id: "miami-lou", pseudo: "lou.crepe", prenom: "Lou", avatar: "miami:pompon" },
  noe: { id: "miami-noe", pseudo: "noe.tajine", prenom: "Noé", avatar: "miami:solaire" },
  rose: { id: "miami-rose", pseudo: "rose.pistache", prenom: "Rose", avatar: "miami:platine" },
  theo: { id: "miami-theo", pseudo: "theo.falafel", prenom: "Théo", avatar: "miami:pirate" },
  mila: { id: "miami-mila", pseudo: "mila.risotto", prenom: "Mila", avatar: "miami:fiesta" },
} as const satisfies Record<string, PersonneResume>;

export const LIEUX_MIAMIS_EXEMPLES = {
  capitaine: { id: lieuDemoPro.id, nom: lieuDemoPro.nom, emoji: lieuDemoPro.emoji, type: lieuDemoPro.type, ville: lieuDemoPro.ville },
  comptoir: { id: 9101, nom: "Le Comptoir des Miamis", emoji: "🍲", type: "resto", ville: "Montpellier" },
  cantine: { id: 9102, nom: "La Cantine de la Brigade", emoji: "🥘", type: "resto", ville: "Montpellier" },
  bouee: { id: 9103, nom: "La Bouée Gourmande", emoji: "🥞", type: "resto", ville: "Montpellier" },
} as const satisfies Record<string, LieuResume>;
