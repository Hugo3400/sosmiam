// Banc d'essai de l'app : l'API avec les comptes, l'espace pro et les adresses /app EN MÉMOIRE (aucune base), une clé de
// chiffrement DE TEST (jamais la vraie), une horloge réglable et des demandes JSON avec le jeton en « Authorization:
// Bearer » (comme l'app) ou en X-Session-Compte (comme le site). Chaque appel a sa propre IP, sauf si le test en donne une.
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import type { VersionMinimaleApp } from "../../src/controleurs/app.ts";
import type { StockageSessionsComptes } from "../../src/middlewares/proteger-comptes.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import { FICHE_TEST, type Reponse } from "./creer-banc-pro.ts";

export const MOT_DE_PASSE_TEST = "mon chat adore les croissants";

type OptionsBanc = { sansCle?: boolean; versionMinimale?: VersionMinimaleApp };

export async function creerBancApp({ sansCle = false, versionMinimale }: OptionsBanc = {}) {
  const banc = { horloge: Date.parse("2026-10-09T10:00:00Z") };
  const cleTest = randomBytes(32);
  const chiffrement = sansCle ? null : creerChiffrementDonnees(cleTest);
  const memoire = creerComptesEnMemoire(() => banc.horloge);
  /** Écritures de l'activité des sessions, comptées (elles doivent rester rares) */
  const ecritures = { toucher: 0 };
  const sessions: StockageSessionsComptes = {
    ...memoire.sessions,
    toucher: async (empreinte, activite) => (ecritures.toucher++, memoire.sessions.toucher(empreinte, activite)),
  };
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: {
      services: memoire.services, sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro,
      horloge: () => banc.horloge, chiffrement,
    },
    app: { horloge: () => banc.horloge, ...(versionMinimale ? { versionMinimale: () => versionMinimale } : {}) },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

  let visiteur = 0;
  type Options = { jeton?: string; site?: boolean; corps?: unknown; ip?: string };
  /** Le jeton part en « Authorization: Bearer » (l'app), ou en X-Session-Compte avec `site` */
  async function demander(methode: string, chemin: string, options: Options = {}): Promise<Reponse> {
    const { jeton, site = false } = options;
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: {
        "X-IP-Visiteur": options.ip ?? `visiteur-${++visiteur}`, "Content-Type": "application/json",
        ...(jeton ? (site ? { "X-Session-Compte": jeton } : { Authorization: `Bearer ${jeton}` }) : {}),
      },
      body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
    });
    return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
  }

  let numero = 0;
  /** Le corps d'une inscription de l'app (dès 15 ans), retouchable */
  const inscriptionApp = (retouches: Record<string, unknown> = {}) => ({
    email: `app${++numero}@exemple.fr`, motDePasse: MOT_DE_PASSE_TEST, prenom: "Zoé", dateNaissance: "2000-01-31", ville: "Nantes", cgu: true,
    espace: "app", ...retouches,
  });
  /** Inscrit un compte de l'app (201 attendu) : son id, son jeton (session « app ») et son compte */
  async function inscrireApp(retouches: Record<string, unknown> = {}) {
    const corps = inscriptionApp(retouches);
    const reponse = await demander("POST", "/comptes", { corps });
    if (reponse.statut !== 201) throw new Error(`inscription de test impossible : ${reponse.statut} ${JSON.stringify(reponse.corps)}`);
    const garde = [...memoire.comptes.values()].find((compte) => compte.email === corps.email);
    if (!garde) throw new Error("compte de test introuvable");
    return { id: garde.id, email: corps.email, jeton: reponse.corps.session as string, compte: reponse.corps.compte };
  }

  let prochainLieu = 500;
  function ajouterLieu() {
    const id = ++prochainLieu;
    memoire.lieux.set(id, structuredClone(FICHE_TEST));
    return id;
  }
  /** Rattachement « gerant » demandé par ce compte, puis validé par l'équipe */
  async function rendrePro(jeton: string) {
    const lieuId = ajouterLieu();
    const demande = await demander("POST", "/comptes/moi/rattachements", { jeton, corps: { lieuId, role: "gerant", preuve: "Je suis la gérante." } });
    if (!memoire.deciderRattachement(demande.corps.id, "valide")) throw new Error("validation de test impossible");
    return lieuId;
  }

  return {
    banc, memoire, chiffrement, ecritures, demander, inscriptionApp, inscrireApp, rendrePro,
    fermer: () => new Promise<void>((fini) => serveur.close(() => fini())),
  };
}
