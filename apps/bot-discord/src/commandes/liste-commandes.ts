// Toutes les commandes du bot. Une nouvelle commande = un fichier dans ce dossier + une ligne ici.
import { bigSos } from "./big-sos.ts";
import { config } from "./config.ts";
import { contact } from "./contact.ts";
import { faq } from "./faq.ts";
import { proposerLieu } from "./proposer-lieu.ts";
import { publier } from "./publier.ts";
import { sosmiam } from "./sosmiam.ts";
import type { Commande } from "./type-commande.ts";

export const commandes = new Map<string, Commande>(
  [sosmiam, faq, bigSos, proposerLieu, contact, config, publier].map((commande) => [commande.definition.name, commande]),
);
