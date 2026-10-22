// Banc d'essai de la partie sociale de l'app : l'API avec les comptes et la partie sociale EN MÉMOIRE (aucune base), une clé
// des données DE TEST (jamais la vraie), une horloge réglable et des personnes prêtes à faire des demandes JSON avec leur
// jeton en « Authorization: Bearer » (comme l'app). Chaque demande a sa propre IP, sauf si le test en donne une. Un compte
// supprimé (supprimerCompte, ou effacerCompte du double des comptes, route comprise) part aussi des tables sociales, avec les
// cascades et les SET NULL de la base (oublierCompteEnMemoire). lireRole est celui du double pro (rattachements de test).
// estLimite (compte limité par l'équipe) : absente par défaut, rien n'est refusé. `limitations` : le double des limitations
// (creerLimitationsEnMemoire, même horloge), lu par l'export (GET /app/social/export) ; il ne refuse rien tout seul.
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { lireAncienTitulaireEnMemoire } from "../../src/services/bande-en-memoire.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import { creerLimitationsEnMemoire } from "../../src/services/limitations-comptes-en-memoire.ts";
import { creerSocialAppEnMemoire, type OptionsSocialAppEnMemoire } from "../../src/services/social-app-en-memoire.ts";
import { oublierCompteEnMemoire } from "../../src/services/tables-sociales-en-memoire.ts";
import { oublierCompteCommunauteEnMemoire } from "../../src/services/communaute-en-memoire.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReponseSociale = { statut: number; corps: any; entetes: Headers };

export type PersonneDeTest = {
  compteId: number;
  /** null : sans profil social (sansProfil ou sansPseudo) */
  idPublic: string | null;
  jeton: string;
  demander: (methode: string, chemin: string, corps?: unknown, ip?: string) => Promise<ReponseSociale>;
};

type OptionsPersonne = { pseudo?: string; prenom?: string; prive?: boolean; ville?: string; avatar?: string; sansPseudo?: boolean; sansProfil?: boolean };

export async function creerBancSocial(o: { sansCle?: boolean } & Pick<OptionsSocialAppEnMemoire, "prevenirCompte" | "tirer" | "partLibre" | "lireRole" | "estLimite" | "gif"> = {}) {
  const horloge = { maintenant: Date.parse("2026-10-14T10:00:00Z") };
  const lireHorloge = () => horloge.maintenant;
  const memoire = creerComptesEnMemoire(lireHorloge);
  const chiffrement = o.sansCle ? null : creerChiffrementDonnees(randomBytes(32));
  // Limiter un compte (banc.limitations.limiterCompte) le fait apparaître dans son export
  const limitations = creerLimitationsEnMemoire(lireHorloge, (id) => memoire.comptes.has(id));
  const social = creerSocialAppEnMemoire({
    ...o, chiffrement, comptes: memoire.comptes, horloge: lireHorloge, listerLimitations: limitations.services.listerLimitationsDuCompte,
    // Le gérant d'un lieu : un rattachement validé du double pro (memoire.rattachements, ou le parcours /pro)
    lireRole: o.lireRole ?? ((compteId, lieuId) => memoire.pro.lireRole(compteId, lieuId)),
    // Les pseudos libérés du double des comptes (un ancien lien d'invitation après un changement de pseudo)
    lireAncienTitulaire: lireAncienTitulaireEnMemoire(memoire.pseudosReserves),
  });
  // Comme la base : effacer un compte efface aussi ses lignes sociales et ses limitations (cascades) et le remplace par null
  // ailleurs (SET NULL)
  const effacerCompte = memoire.services.effacerCompte.bind(memoire.services);
  memoire.services.effacerCompte = async (id) => {
    await effacerCompte(id);
    oublierCompteEnMemoire(social.tables, id);
    oublierCompteCommunauteEnMemoire(social.tables, id);
    limitations.oublierCompte(id);
  };
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: lireHorloge, chiffrement },
    socialApp: social.dependances,
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

  let visiteur = 0;
  async function demander(methode: string, chemin: string, options: { jeton?: string; corps?: unknown; ip?: string } = {}): Promise<ReponseSociale> {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: {
        "X-IP-Visiteur": options.ip ?? `visiteur-social-${++visiteur}`, "Content-Type": "application/json",
        ...(options.jeton ? { Authorization: `Bearer ${options.jeton}` } : {}),
      },
      body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
    });
    return { statut: reponse.status, corps: await reponse.json(), entetes: reponse.headers };
  }

  let numero = 0;
  /** Un compte de l'app avec sa session ; par défaut, son profil social ouvert (POST /app/social/moi), donc un idPublic */
  async function creerPersonne(p: OptionsPersonne = {}): Promise<PersonneDeTest> {
    numero += 1;
    const compteId = await memoire.services.creerCompte({
      email: `social${numero}@exemple.fr`, motDePasse: "empreinte", prenom: p.prenom ?? `Miami${numero}`, ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro",
    });
    const compte = typeof compteId === "number" ? memoire.comptes.get(compteId) : undefined;
    if (typeof compteId !== "number" || !compte) throw new Error("compte de test impossible");
    Object.assign(compte, {
      pseudo: p.sansPseudo ? null : (p.pseudo ?? `miami.${numero}`), prive: p.prive ?? false, villeApp: p.ville ?? "Nantes", avatar: p.avatar ?? null,
    });
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId, creeLe: horloge.maintenant, activite: horloge.maintenant, support: "app" });
    const personne: PersonneDeTest = {
      compteId, idPublic: null, jeton,
      demander: (methode, chemin, corps, ip) => demander(methode, chemin, { jeton, corps, ip }),
    };
    if (!p.sansPseudo && !p.sansProfil) {
      const ouvert = await personne.demander("POST", "/app/social/moi");
      if (ouvert.statut !== 201) throw new Error(`profil social de test impossible : ${ouvert.statut}`);
      personne.idPublic = ouvert.corps.moi.personne.id;
    }
    return personne;
  }

  /** Deux personnes dans la même bande (deux lignes, comme le fait la bande) */
  function rendrePotes(a: PersonneDeTest, b: PersonneDeTest, creeLe = new Date(horloge.maintenant)) {
    social.tables.bande.push({ compteId: a.compteId, poteId: b.compteId, creeLe }, { compteId: b.compteId, poteId: a.compteId, creeLe });
  }
  /** a suit b (« accepte ») */
  function suivre(a: PersonneDeTest, b: PersonneDeTest, statut: "accepte" | "demande" | "refuse" = "accepte", creeLe = new Date(horloge.maintenant)) {
    social.tables.suivis.push({ suiveurId: a.compteId, suiviId: b.compteId, statut, creeLe, accepteLe: statut === "accepte" ? creeLe : null });
  }
  /** a bloque b */
  function bloquer(a: PersonneDeTest, b: PersonneDeTest) {
    social.tables.blocages.push({ bloqueurId: a.compteId, bloqueId: b.compteId, creeLe: new Date(horloge.maintenant) });
  }

  /** Supprime le compte (comme DELETE /comptes/moi) : comptes, sessions, puis tables sociales */
  async function supprimerCompte(p: PersonneDeTest) {
    await memoire.services.effacerCompte(p.compteId);
  }

  return {
    horloge, memoire, social, tables: social.tables, pushs: social.pushs, limitations: limitations.services, demander, creerPersonne, rendrePotes, suivre, chiffrement,
    bloquer, supprimerCompte,
    /** Les notifications partent au tour suivant de la boucle (après la réponse) */
    attendreEnvois: () => new Promise<void>((fini) => setImmediate(() => setImmediate(fini))),
    fermer: () => new Promise<void>((fini) => serveur.close(() => fini())),
  };
}
