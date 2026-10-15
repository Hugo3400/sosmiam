// Le serveur en doublure (GET et PATCH /comptes/moi/profil, « mes décisions ») et le vrai moteur monté autour de lui.
// Il refuse comme l'API, et un refus n'écrit rien : des régimes (ils ne partent jamais : RGPD), un avatar refusé exprès
// ou un Miami qu'on ne peut pas choisir, un compte limité (prénom, pseudo ou avatar changés), un pseudo pris. `s` garde ce
// qu'il a vu (demandes) et ce que l'app a montré (vues, profil, avatar) ; un essai règle ses humeurs (horsLigne, retard,
// limite, refuserAvatar, pris, decisions).
import { lireAvatarMiami } from "@sos-miam/commun/validation/lire-avatar-miami";
import { creerMoteurSynchroProfil } from "~/services/synchro-profil";
import { CLE_SYNCHRO, DEFAUT, LOCAL, VU } from "./donnees.mjs";
import { oublierMinuteries, pause } from "./minuteries.mjs";

/** Remet les doublures comme au lancement d'un processus (sans délai, rien de gardé) */
export function remettreDoublures() {
  globalThis.__magasin = new Map();
  globalThis.__disque = null;
  globalThis.__ecritures = [];
  globalThis.__journalAvatar = [];
  globalThis.__avatarDisque = null;
  globalThis.__avatarEchec = false;
  globalThis.__delaiMagasin = 0;
  globalThis.__delaiEcriture = 0;
  globalThis.__delaiAvatar = 0;
}

/** Un Miami qu'une personne ne peut pas choisir (comme lireAvatar de l'API : jamais le Capitaine, jamais un Miami inconnu) */
const estMiamiRefuse = (avatar) => typeof avatar === "string" && avatar.startsWith("miami:") && lireAvatarMiami(avatar)?.reserve !== false;

export function monter(o = {}) {
  globalThis.__magasin = new Map(o.magasin ?? []);
  globalThis.__disque = null;
  globalThis.__ecritures = [];
  globalThis.__journalAvatar = [];
  globalThis.__avatarDisque = null;
  globalThis.__avatarEchec = false;
  // Chaque état gardé passe aussi au journal de l'avatar : l'ordre « marque, puis avatar » se lit d'un coup d'œil
  const poser = globalThis.__magasin.set.bind(globalThis.__magasin);
  globalThis.__magasin.set = (cle, valeur) => {
    if (cle === CLE_SYNCHRO) globalThis.__journalAvatar.push("marque:" + JSON.stringify(JSON.parse(valeur).aEnvoyer.map((m) => m.champ)));
    return poser(cle, valeur);
  };
  const s = {
    serveur: structuredClone(o.serveur ?? VU),
    demandes: [],
    vues: [],
    horsLigne: false,
    retard: null,
    decisions: o.decisions ?? [],
    pris: new Set(o.pris ?? []),
    limite: o.limite === true,
    refuserAvatar: false,
    avatar: undefined,
    profil: undefined,
  };
  const repondre = async () => {
    if (s.retard) await s.retard;
  };
  const comptes = {
    lireProfil: async () => {
      s.demandes.push("GET");
      await repondre();
      if (s.horsLigne) return { ok: false, erreur: "hors-ligne" };
      return { ok: true, profil: structuredClone(s.serveur) };
    },
    modifierProfil: async (m) => {
      s.demandes.push("PATCH " + JSON.stringify(m));
      await repondre();
      if (s.horsLigne) return { ok: false, erreur: "hors-ligne" };
      if (m.envies && "regimes" in m.envies) return { ok: false, erreur: "champ-invalide", champ: "envies" };
      if (s.refuserAvatar && m.avatar !== undefined) return { ok: false, erreur: "champ-invalide", champ: "avatar" };
      if (estMiamiRefuse(m.avatar)) return { ok: false, erreur: "champ-invalide", champ: "avatar" };
      // Comme comptes-profil.ts : compte limité, un prénom, un pseudo ou un avatar différent est refusé (une valeur inchangée passe)
      const change = (champ) => m[champ] !== undefined && m[champ] !== s.serveur[champ];
      if (s.limite && (change("prenom") || change("pseudo") || (m.avatar && change("avatar")))) {
        return { ok: false, erreur: "compte-limite", details: { jusqua: null } };
      }
      if (change("pseudo") && s.pris.has(m.pseudo)) return { ok: false, erreur: "pseudo-pris" };
      s.serveur = { ...s.serveur, ...m, ...(m.avatar === "" ? { avatar: null } : {}) };
      return { ok: true, profil: structuredClone(s.serveur) };
    },
  };
  const moteur = creerMoteurSynchroProfil({
    comptes,
    moderation: { listerDecisions: async () => ({ ok: true, decisions: s.decisions }) },
    rafraichirCompte: async () => {},
    afficherProfil: (p) => (s.profil = p),
    afficherAvatar: (a) => (s.avatar = a),
    montrer: (v) => s.vues.push(v),
  });
  return { moteur, s };
}

/**
 * Monte le moteur comme FournisseurProfil : l'avatar avant le profil, l'état gardé relu, puis la synchro allumée (sa
 * première lecture faite). `avatar: null` : aucun avatar posé ; `profil: null` : une visite (rien n'est allumé) ;
 * `attente` : le temps laissé à la première lecture (ms).
 */
export async function demarrer(o = {}) {
  oublierMinuteries();
  const t = monter(o);
  if (o.avatar !== null) t.moteur.poserAvatar(structuredClone(o.avatar ?? DEFAUT));
  if (o.profil !== null) t.moteur.poserProfil(structuredClone(o.local ?? LOCAL));
  t.moteur.charger();
  await pause(5);
  if (o.profil !== null) {
    t.moteur.activer(true);
    await pause(o.attente ?? 40);
  }
  return t;
}

/** Les PATCH vus par le serveur */
export const lirePatchs = (s) => s.demandes.filter((d) => d.startsWith("PATCH"));
/** Les PATCH qui emportaient un avatar */
export const lirePatchsAvecAvatar = (s) => lirePatchs(s).filter((d) => d.includes('"avatar"'));
/** Les écritures de l'avatar sur le téléphone */
export const lireEcrituresAvatar = () => globalThis.__journalAvatar.filter((e) => e.startsWith("avatar:"));
