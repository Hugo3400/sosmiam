import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import { creerLimitationsEnMemoire } from "../../src/services/limitations-comptes-en-memoire.ts";
import { brancherPhotosProfil, creerPhotosProfil } from "../../src/services/photos-profil.ts";
import { creerDepotPhotosProfilEnMemoire } from "../../src/services/photos-profil-en-memoire.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerStockagePhotosProfilEnMemoire } from "../../src/services/stockage-photos-profil.ts";

export type ReponseBanc = { statut: number; entetes: Headers; octets: Buffer; corps: Record<string, any> | null };
export type DemandeBanc = { jeton?: string; json?: unknown; octets?: Uint8Array; type?: string };

const DEBUT = Date.parse("2026-10-15T10:00:00Z");
const MOT_DE_PASSE = "mon chat adore les croissants";

export async function creerBancPhotosProfil(o: { sansCle?: boolean } = {}) {
  const banc = { horloge: DEBUT };
  const horloge = () => banc.horloge;
  const memoire = creerComptesEnMemoire(horloge);
  const limitations = creerLimitationsEnMemoire(horloge);
  const donnees = creerDepotPhotosProfilEnMemoire({
    comptes: memoire.comptes,
    estLimite: async (compteId, maintenant) => (await limitations.services.estLimite(compteId, maintenant)) !== null,
  });
  const stockage = creerStockagePhotosProfilEnMemoire({ horloge });
  const medias = creerStockageMediasChatEnMemoire({ horloge });
  const chiffrementDonnees = creerChiffrementDonnees(new Uint8Array(32).fill(7));
  const chiffrement = o.sansCle ? null : creerChiffrementSocial(chiffrementDonnees);
  const photos = creerPhotosProfil({ stockage, depot: donnees.depot, preuves: { chiffrement, medias }, horloge });
  brancherPhotosProfil(photos);

  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: {
      services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge,
      chiffrement: chiffrementDonnees, limitations: limitations.services, photos,
    },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let visiteur = 0;
  let numero = 0;

  async function demander(methode: string, chemin: string, d: DemandeBanc = {}): Promise<ReponseBanc> {
    const entetes: Record<string, string> = { "X-IP-Visiteur": `visiteur-${++visiteur}` };
    if (d.jeton) entetes.Authorization = `Bearer ${d.jeton}`;
    let body: RequestInit["body"];
    if (d.json !== undefined) {
      entetes["Content-Type"] = "application/json";
      body = JSON.stringify(d.json);
    } else if (d.octets) {
      entetes["Content-Type"] = d.type ?? "image/jpeg";
      body = d.octets as RequestInit["body"];
    }
    const reponse = await fetch(`${adresse}${chemin}`, { method: methode, headers: entetes, body });
    const octets = Buffer.from(await reponse.arrayBuffer());
    const json = (reponse.headers.get("content-type") ?? "").includes("application/json");
    return { statut: reponse.status, entetes: reponse.headers, octets, corps: json ? JSON.parse(octets.toString("utf8")) : null };
  }

  async function inscrire(avatar: string | null = "🦊") {
    const n = ++numero;
    const email = `photo${n}@exemple.fr`;
    const r = await demander("POST", "/comptes", {
      json: { email, motDePasse: MOT_DE_PASSE, prenom: "Zoé", dateNaissance: "2000-01-31", ville: "Nantes", cgu: true, espace: "app", pseudo: `zoe_photo_${n}` },
    });
    assert.equal(r.statut, 201, JSON.stringify(r.corps));
    const id = [...memoire.comptes.values()].find((c) => c.email === email)?.id;
    if (!id) throw new Error("compte de test introuvable");
    if (avatar) assert.equal((await demander("PATCH", "/comptes/moi/profil", { jeton: r.corps!.session, json: { avatar } })).statut, 200);
    return { id, jeton: r.corps!.session as string };
  }

  async function limiter(compteId: number) {
    const r = await limitations.services.limiterCompte({ compteId, motif: "haine", motivation: "Une photo de profil insultante pour la Brigade." });
    assert.ok(r.ok, JSON.stringify(r));
  }

  return {
    banc, adresse, memoire, donnees, stockage, medias, chiffrement, photos, demander, inscrire, limiter, MOT_DE_PASSE,
    brancher: () => brancherPhotosProfil(photos),
    fermer: () => new Promise<void>((fini) => serveur.close(() => fini())),
  };
}
