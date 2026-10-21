import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";

import express from "express";

import { gererErreurs } from "../../src/middlewares/gerer-erreurs.ts";
import { creerRoutesSecurite } from "../../src/routes/securite.ts";
import { creerChiffrementDonnees, type CleVersionnee } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSecurite } from "../../src/services/chiffrement-securite.ts";
import { nettoyerJpeg } from "../../src/services/nettoyeur-jpeg.ts";
import { creerDepotSecuriteEnMemoire } from "../../src/services/securite-en-memoire.ts";
import type { DepotSecurite } from "../../src/services/securite-regles.ts";
import { creerSecurite } from "../../src/services/securite-services.ts";
import { creerStockageSignalementsSecuriteEnMemoire } from "../../src/services/stockage-signalements-securite.ts";
import { fabriquerBlocPng, fabriquerPng } from "./fabriquer-png.ts";

export const DEBUT_BANC_SECURITE = Date.parse("2026-10-22T10:00:00Z");
export const CLE_BANC_SECURITE = new Uint8Array(32).fill(8);
export const SECRET_PNG = "position:43.6108,3.8767 TelephoneDeZoe";
export const JPEG_POSITION = readFileSync(new URL("../donnees/photo-exif-position.jpg", import.meta.url));
export const SECRETS_JPEG = ["position:47.2184", "GPSLatitude", "TelephoneDeLea", "chez-lea"];

export const fabriquerPngBavard = () => fabriquerPng({
  avant: [
    fabriquerBlocPng("tEXt", Buffer.from(`Comment\0${SECRET_PNG}`, "latin1")),
    fabriquerBlocPng("tIME", Buffer.from([0x07, 0xea, 10, 22, 9, 30, 0])),
    fabriquerBlocPng("eXIf", Buffer.from(`MM\0*${SECRET_PNG}`, "latin1")),
    fabriquerBlocPng("iTXt", Buffer.from(`XML:com.adobe.xmp\0\0\0\0\0${SECRET_PNG}`, "latin1")),
    fabriquerBlocPng("sRGB", Buffer.from([0])),
  ],
  apres: [fabriquerBlocPng("zTXt", Buffer.from(`Author\0\0${SECRET_PNG}`, "latin1"))],
  fin: Buffer.from(SECRET_PNG, "latin1"),
});

export const image = (octets: Buffer, nomFichier = "capture.png") => ({ nomFichier, base64: octets.toString("base64") });

let numero = 0;
export const signalement = (o: Record<string, unknown> = {}) => ({
  nom: "Zoé Martin",
  email: `zoe.${++numero}@exemple.fr`,
  cible: "api",
  titre: "Une route rend l'e-mail des autres",
  description: "En changeant l'identifiant dans l'adresse, on lit l'e-mail d'un autre compte. Étapes ci-dessous.",
  lien: "https://exemple.fr/video",
  majeur: true,
  reglesAcceptees: true,
  nomTableauHonneur: "Zoé M.",
  images: [],
  ...o,
});

export type OptionsBancSecurite = {
  sansCle?: boolean;
  cle?: Uint8Array;
  version?: number;
  anciennes?: CleVersionnee[];
  depot?: DepotSecurite;
};

export function creerServicesBancSecurite(o: OptionsBancSecurite = {}) {
  const banc = { horloge: DEBUT_BANC_SECURITE };
  const horloge = () => banc.horloge;
  const memoire = creerDepotSecuriteEnMemoire();
  const depot = o.depot ?? memoire;
  const stockage = creerStockageSignalementsSecuriteEnMemoire({ horloge });
  const donnees = creerChiffrementDonnees(o.cle ?? CLE_BANC_SECURITE, { version: o.version, anciennes: o.anciennes });
  const chiffrement = o.sansCle ? null : creerChiffrementSecurite(donnees);
  const securite = creerSecurite({ depot, stockage, chiffrement, nettoyerJpeg, horloge });
  return { banc, horloge, memoire, stockage, chiffrement, securite };
}

export async function creerBancSecurite(o: OptionsBancSecurite = {}) {
  const services = creerServicesBancSecurite(o);
  const application = express();
  application.use("/securite", creerRoutesSecurite(services.securite));
  application.use(express.json({ limit: "4kb" }));
  application.use((_requete, reponse) => void reponse.status(404).json({ ok: false, erreur: "introuvable" }));
  application.use(gererErreurs);
  const serveur = application.listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let visiteur = 0;

  async function demander(methode: string, chemin: string, json?: unknown, ip = `203.0.113.${++visiteur}`) {
    const entetes: Record<string, string> = { "X-IP-Visiteur": ip };
    if (json !== undefined) entetes["Content-Type"] = "application/json";
    const corpsEnvoye = typeof json === "string" ? json : json === undefined ? undefined : JSON.stringify(json);
    const reponse = await fetch(`${adresse}${chemin}`, { method: methode, headers: entetes, body: corpsEnvoye });
    const texte = await reponse.text();
    let corps: Record<string, any> | null = null;
    try {
      corps = JSON.parse(texte) as Record<string, any>;
    } catch {
      corps = null;
    }
    return { statut: reponse.status, entetes: reponse.headers, corps };
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { ...services, demander, fermer };
}
