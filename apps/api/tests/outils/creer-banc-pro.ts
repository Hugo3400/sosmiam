// Banc d'essai de l'espace pro : l'API avec les comptes, les lieux et l'espace pro EN MÉMOIRE (aucune base), une horloge
// réglable, des comptes avec session ouverte et des demandes JSON. Chaque appel a sa propre IP, sauf si le test en donne une.
import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import type { LieuEnMemoire } from "../../src/services/suggestions-comptes-en-memoire.ts";

/** Une fiche de test complète (numéros de la tranche réservée à la fiction, site en example.com) */
export const FICHE_TEST: LieuEnMemoire = {
  statut: "publie", nom: "Chez Léa", adresse: "3 rue de la Loge", horaires: "Mar–sam, 12h–14h30", texte: "Des pâtes fraîches.",
  telephone: "04 65 71 00 01", siteWeb: "https://chezlea.example.com/", instagram: null, animaux: null, accessible: true, terrasse: null,
  wifi: null, enfants: null, parking: null, paiements: ["cb", "especes"], reservation: null,
  type: "resto", emoji: "🍝", info: "Trattoria", quartier: "Écusson", ville: "Montpellier", prix: "€€", couleurs: ["#FFD60A", "#FF7A00"], decouvertPar: "Sam",
};

export type Reponse = { statut: number; corps: Record<string, any>; entetes: Headers };

export async function creerBancPro() {
  const banc = { horloge: Date.parse("2026-10-09T10:00:00Z") };
  const memoire = creerComptesEnMemoire(() => banc.horloge);
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    lireFichePublique: memoire.lireFichePublique,
    comptes: {
      services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro,
      horloge: () => banc.horloge,
    },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

  let visiteur = 0;
  async function demander(methode: string, chemin: string, options: { jeton?: string; corps?: unknown; ip?: string } = {}): Promise<Reponse> {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: {
        "X-IP-Visiteur": options.ip ?? `visiteur-${++visiteur}`, "Content-Type": "application/json",
        ...(options.jeton ? { "X-Session-Compte": options.jeton } : {}),
      },
      body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
    });
    return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
  }

  let numero = 0;
  /** Un compte (simple client, sans fiche d'ambassadeur) et une session ouverte pour lui */
  async function creerCompte(prenom = "Léa") {
    const email = `compte${++numero}@exemple.fr`;
    const id = await memoire.services.creerCompte({ email, motDePasse: "empreinte", prenom, ville: "Montpellier", quartier: null, cguVersion: "2026-10-08" });
    if (id === null) throw new Error("compte de test impossible");
    const compte = memoire.comptes.get(id);
    if (compte) compte.statutAmbassadeur = null;
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge });
    return { id, email, jeton };
  }

  let prochainLieu = 100;
  /** Un lieu de test (copie de FICHE_TEST, retouchée) ; renvoie son id */
  function ajouterLieu(retouches: Partial<LieuEnMemoire> = {}) {
    const id = ++prochainLieu;
    memoire.lieux.set(id, { ...structuredClone(FICHE_TEST), ...retouches });
    return id;
  }

  /** Un gérant validé par l'équipe sur un nouveau lieu (ou sur `lieuId`) */
  async function creerGerant(lieuId = ajouterLieu()) {
    const compte = await creerCompte("Gérant");
    const demande = await demander("POST", "/comptes/moi/rattachements", { jeton: compte.jeton, corps: { lieuId, role: "gerant", preuve: "Je suis le gérant." } });
    if (!memoire.deciderRattachement(demande.corps.id, "valide")) throw new Error("validation de test impossible");
    return { ...compte, lieuId };
  }

  return {
    banc, memoire, demander, creerCompte, ajouterLieu, creerGerant,
    fermer: () => new Promise<void>((fini) => serveur.close(() => fini())),
  };
}
