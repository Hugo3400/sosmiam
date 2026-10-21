import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import { creerCarriere } from "../../src/services/carriere-services.ts";
import { creerDepotCarriereEnMemoire } from "../../src/services/carriere-en-memoire.ts";
import type { DepotCarriere } from "../../src/services/carriere-regles.ts";
import { creerChiffrementCarriere } from "../../src/services/chiffrement-carriere.ts";
import { creerChiffrementDonnees, type CleVersionnee } from "../../src/services/chiffrement-donnees.ts";
import { creerStockageCandidaturesEnMemoire } from "../../src/services/stockage-candidatures.ts";

export const DEBUT_BANC_CARRIERE = Date.parse("2026-10-21T10:00:00Z");
export const CLE_BANC_CARRIERE = new Uint8Array(32).fill(7);

export const OFFRE_BANC = {
  titre: "Modération avec la Brigade",
  type: "benevolat",
  domaine: "moderation",
  resume: "Aide la Brigade à garder SOS Miam accueillant, à ton rythme.",
  description: "Tu relis ce que les Miamis signalent, depuis ton ordi, sans minimum d'heures.",
  missions: ["Relire les avis signalés"],
  profil: ["Dès 18 ans, où que tu sois en France"],
  enEchange: ["Une attestation de bénévolat"],
};

export function fabriquerPdf(contenu = "Bonjour la Brigade", remplissage = 0): Buffer {
  return Buffer.concat([
    Buffer.from(`%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n% ${contenu}\n`, "latin1"),
    Buffer.alloc(remplissage, 0x41),
    Buffer.from("\ntrailer << /Root 1 0 R >>\n%%EOF\n", "latin1"),
  ]);
}

export type OptionsBancCarriere = {
  sansCle?: boolean;
  cle?: Uint8Array;
  version?: number;
  anciennes?: CleVersionnee[];
  depot?: DepotCarriere;
};

export function creerServicesBancCarriere(o: OptionsBancCarriere = {}) {
  const banc = { horloge: DEBUT_BANC_CARRIERE };
  const horloge = () => banc.horloge;
  const memoire = creerDepotCarriereEnMemoire();
  const depot = o.depot ?? memoire;
  const stockage = creerStockageCandidaturesEnMemoire({ horloge });
  const donnees = creerChiffrementDonnees(o.cle ?? CLE_BANC_CARRIERE, { version: o.version, anciennes: o.anciennes });
  const chiffrement = o.sansCle ? null : creerChiffrementCarriere(donnees);
  const carriere = creerCarriere({ depot, stockage, chiffrement, horloge });
  return { banc, horloge, memoire, stockage, chiffrement, carriere };
}

export async function creerBancCarriere(o: OptionsBancCarriere = {}) {
  const services = creerServicesBancCarriere(o);
  const serveur = creerApplication({ enregistrerInscription: async () => {}, carriere: services.carriere }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let visiteur = 0;

  async function demander(methode: string, chemin: string, json?: unknown, ip = `203.0.113.${++visiteur}`) {
    const entetes: Record<string, string> = { "X-IP-Visiteur": ip };
    if (json !== undefined) entetes["Content-Type"] = "application/json";
    const reponse = await fetch(`${adresse}${chemin}`, { method: methode, headers: entetes, body: json === undefined ? undefined : JSON.stringify(json) });
    const texte = await reponse.text();
    let corps: Record<string, any> | null = null;
    try {
      corps = JSON.parse(texte) as Record<string, any>;
    } catch {
      corps = null;
    }
    return { statut: reponse.status, entetes: reponse.headers, corps };
  }

  async function publier(donnees: Record<string, unknown> = OFFRE_BANC): Promise<string> {
    const creee = await services.carriere.creerOffre(donnees);
    if (!creee.ok) throw new Error(`offre refusée : ${JSON.stringify(creee)}`);
    await services.carriere.publierOffre(creee.offre.id);
    return creee.offre.id;
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { ...services, demander, publier, fermer };
}
