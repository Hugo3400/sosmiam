// La synchro du profil d'un compte connecté, sans React : le serveur fait foi, le téléphone garde une copie pour s'ouvrir
// hors ligne et ne gagne que pour un champ changé ici, pas encore parti (marque « à envoyer »). Les régimes ne partent
// jamais (RGPD, article 9) ; la date de naissance non plus (seule l'équipe la corrige). Contrat : PATCH et GET
// /comptes/moi/profil (packages/commun/src/client-api/contrat-compte.ts), un refus n'y écrit rien.
import type { ServiceCompte } from "@sos-miam/commun/client-api/contrat-compte";
import type { ServiceModerationApp } from "@sos-miam/commun/client-api/contrat-moderation-app";
import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ProfilServeur } from "@sos-miam/commun/types/compte-app";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Profil } from "@sos-miam/commun/types/profil";
import type { DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import { appliquerChangementsInfos } from "~/fonctions/compte/appliquer-changements-infos";
import { estPseudoNeutre } from "~/fonctions/compte/est-pseudo-neutre";
import { expliquerPseudoServeur } from "~/fonctions/compte/expliquer-pseudo-serveur";
import { fusionnerProfilServeur } from "~/fonctions/compte/fusionner-profil-serveur";
import { listerChampsDifferents } from "~/fonctions/compte/lister-champs-differents";
import { preparerModificationsProfil } from "~/fonctions/compte/preparer-modifications-profil";
import { sontProfilsIdentiques } from "~/fonctions/compte/sont-profils-identiques";
import { trierRefusProfil } from "~/fonctions/compte/trier-refus-profil";
import { trouverDecisionProfil } from "~/fonctions/compte/trouver-decision-profil";
import type { ChangementsInfos, ResultatInfos } from "~/hooks/utiliser-profil";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { enregistrerProfilLocal } from "~/stockage/profil-local";
import {
  creerSynchroProfil,
  effacerSynchroProfil,
  enregistrerSynchroProfil,
  lireSynchroProfil,
  type AnnonceSynchro,
  type ChampSynchro,
  type SynchroProfil,
} from "~/stockage/synchro-profil";

/** Nouveaux essais sans réseau : 30 s, puis 2 min, puis toutes les 10 min (ou ce que dit Retry-After), app ouverte */
const ATTENTES_MS = [30_000, 120_000, 600_000];
/** Au retour dans l'app, le profil est relu si la dernière lecture date de plus d'une minute */
const RELECTURE_MS = 60_000;
/** Un pseudo retiré par l'équipe reste réservé pour personne pendant 30 jours */
const RESERVATION_MS = 30 * 24 * 3600_000;
/** Pas de réponse, ou le serveur trébuche : on réessaie plus tard, rien n'est perdu */
const PASSAGERES = new Set<ErreurService>(["hors-ligne", "trop-de-demandes", "chiffrement-indisponible", "service-indisponible", "erreur-serveur"]);
/** Le serveur trébuche autant de fois de suite : plus d'essai tout seul avant le prochain retour dans l'app */
const ECHECS_SERVEUR_MAX = 3;
/** Garde-fou : jamais plus de demandes d'affilée pour une même synchro */
const TOURS_MAX = 6;

type Memoire = {
  /** L'état gardé sur le téléphone est relu (rien ne part avant) */
  pret: boolean;
  etat: SynchroProfil;
  /** Dernier numéro de marque donné */
  numero: number;
  essais: number;
  /** « Trop de demandes » : rien ne part avant cet instant */
  pasAvant: number;
  echecsServeur: number;
  /** Une lecture (GET) est demandée ; un envoi (PATCH) en tient lieu, sa réponse est le profil entier */
  relire: boolean;
  pompePrevue: boolean;
  /** Mes infos attend son tour : la synchro de fond lui cède la place */
  infosEnAttente: number;
  /** La ville inconnue du serveur est déjà repartie une fois pendant ce lancement */
  villeReparee: boolean;
};

export type VueSynchro = { annonce: AnnonceSynchro | null; pseudoMisDeCote: string | null };

export type OutilsSynchro = {
  comptes: ServiceCompte;
  moderation: ServiceModerationApp;
  rafraichirCompte: () => Promise<void>;
  /** Met le profil à l'écran (le moteur garde la copie à jour, relue au retour de chaque réponse) */
  afficherProfil: (profil: Profil | null) => void;
  montrer: (vue: VueSynchro) => void;
};

const memoireVide = (etat: SynchroProfil = creerSynchroProfil(false)): Memoire => ({
  pret: false, etat, numero: 0, essais: 0, pasAvant: 0, echecsServeur: 0, relire: false, pompePrevue: false, infosEnAttente: 0, villeReparee: false,
});

/** Une marque par champ, avec un nouveau numéro (une marque d'avant est remplacée) */
function marquer(memoire: Memoire, champs: Iterable<ChampSynchro>) {
  for (const champ of new Set(champs)) {
    memoire.numero += 1;
    memoire.etat.aEnvoyer = [...memoire.etat.aEnvoyer.filter((m) => m.champ !== champ), { champ, numero: memoire.numero }];
  }
}

/** Les marques de ces champs posées avant le départ (numéro ≤ `depart`) s'en vont ; celles d'après restent */
function oublierMarques(memoire: Memoire, champs: Iterable<ChampSynchro>, depart: number) {
  const liste = new Set(champs);
  memoire.etat.aEnvoyer = memoire.etat.aEnvoyer.filter((m) => !(liste.has(m.champ) && m.numero <= depart));
}

const champsDe = (c: ChangementsInfos): ChampSynchro[] => (["prenom", "pseudo", "nom", "ville"] as const).filter((champ) => c[champ] !== undefined);
const rienAChanger = (c: ChangementsInfos) => champsDe(c).length === 0;

/**
 * Le moteur de la synchro du profil d'un compte connecté (branché par utiliserSynchroProfil) : une seule demande à la fois
 * (le couloir : Mes infos attend la fin d'un envoi en cours), les écritures du profil l'une après l'autre (le verrou : une
 * fusion ne passe jamais sur des envies cochées pendant le voyage). Démo : tout reste sur le téléphone.
 */
export function creerMoteurSynchroProfil(o: OutilsSynchro) {
  // Le profil à jour, même entre deux rendus (celui de l'écran le suit)
  let profil: Profil | null = null;
  let memoire = memoireVide();
  // Chaque arrêt, effacement ou installation : une nouvelle génération, les réponses d'avant sont ignorées
  let generation = 0;
  let actif = false;
  let couloir: Promise<unknown> = Promise.resolve();
  let verrou: Promise<unknown> = Promise.resolve();
  let minuterie: ReturnType<typeof setTimeout> | null = null;

  function enchainer<T>(etape: () => Promise<T>, file: "couloir" | "verrou"): Promise<T> {
    const suite = (file === "couloir" ? couloir : verrou).then(etape, etape);
    if (file === "couloir") couloir = suite.catch(() => undefined);
    else verrou = suite.catch(() => undefined);
    return suite;
  }
  const sousVerrou = <T>(etape: () => Promise<T>) => enchainer(etape, "verrou");
  const lireProfil = () => profil;

  /** Une annonce de pseudo disparaît dès que le pseudo n'est plus celui qu'elle annonce */
  function suivrePseudo() {
    const annonce = memoire.etat.annonce;
    if (!profil || !annonce || annonce.type === "prenom-limite" || annonce.pseudo === profil.pseudo) return;
    memoire.etat.annonce = null;
    garder();
  }

  function poserProfil(nouveau: Profil | null) {
    profil = nouveau;
    o.afficherProfil(nouveau);
    suivrePseudo();
  }

  /** Écrit le profil sur le téléphone, puis à l'écran */
  async function ecrireProfil(nouveau: Profil) {
    await enregistrerProfilLocal(nouveau);
    poserProfil(nouveau);
  }

  const lireMisDeCote = () => {
    const m = memoire.etat.pseudoMisDeCote;
    return m && Date.parse(m.jusqua) > Date.now() ? m.pseudo : null;
  };

  /** Redessine l'annonce et garde l'état sur le téléphone */
  function garder(enregistrer = true) {
    if (!lireMisDeCote()) memoire.etat.pseudoMisDeCote = null;
    o.montrer({ annonce: memoire.etat.annonce, pseudoMisDeCote: lireMisDeCote() });
    if (enregistrer && memoire.pret) void enregistrerSynchroProfil(memoire.etat);
  }

  function arreterMinuterie() {
    if (minuterie) clearTimeout(minuterie);
    minuterie = null;
  }

  /** Une synchro au couloir, s'il n'y en a pas déjà une qui attend son tour */
  function lancer() {
    const m = memoire;
    if (!actif || !m.pret || m.pompePrevue) return;
    m.pompePrevue = true;
    void enchainer(async () => {
      m.pompePrevue = false;
      if (m === memoire) await pomper();
    }, "couloir");
  }

  function patienter(erreur: ErreurService, details?: DetailsErreur) {
    let attente = ATTENTES_MS[Math.min(memoire.essais, ATTENTES_MS.length - 1)];
    if (erreur === "trop-de-demandes" && details?.attenteS) {
      attente = details.attenteS * 1000;
      memoire.pasAvant = Date.now() + attente;
    }
    memoire.essais += 1;
    memoire.echecsServeur = erreur === "erreur-serveur" ? memoire.echecsServeur + 1 : 0;
    arreterMinuterie();
    if (memoire.echecsServeur < ECHECS_SERVEUR_MAX) minuterie = setTimeout(lancer, attente);
  }

  /**
   * Le serveur montre un autre pseudo que celui d'avant : l'équipe (profil retenu : décision dans « mes décisions », ou
   * forme d'un pseudo neutre si la liste ne se lit pas) ou un autre téléphone du compte (sans bruit). À la première
   * synchro, la liste n'est lue que pour un pseudo neutre.
   */
  async function expliquerPseudo(ancien: string | null, nouveau: string, premiere: boolean) {
    let decision: DecisionModerationApi | null | "illisible" = null;
    if (!premiere || estPseudoNeutre(nouveau)) {
      const r = await o.moderation.listerDecisions();
      const depuis = premiere || !memoire.etat.luLe ? Date.now() - RESERVATION_MS : memoire.etat.luLe;
      decision = r.ok ? trouverDecisionProfil(r.decisions, depuis) : "illisible";
    }
    const { annonce, misDeCote } = expliquerPseudoServeur(ancien, nouveau, decision, premiere, RESERVATION_MS);
    if (misDeCote) memoire.etat.pseudoMisDeCote = misDeCote;
    if (annonce) memoire.etat.annonce = annonce;
  }

  /** Téléphone d'avant la synchro : ce qui diffère vient de Mes infos ou Mes envies, jamais parti. Le téléphone gagne, une fois */
  async function rattraperPremiereFois(local: Profil, serveur: ProfilServeur) {
    marquer(memoire, listerChampsDifferents(local, serveur));
    // Pseudo jamais parti alors que le serveur n'en a aucun : il part (seule exception à « le serveur fait foi »)
    if (local.pseudo && serveur.pseudo === null) marquer(memoire, ["pseudo"]);
    else if (local.pseudo && serveur.pseudo && local.pseudo !== serveur.pseudo) await expliquerPseudo(local.pseudo, serveur.pseudo, true);
    memoire.etat.premiereFaite = true;
  }

  /**
   * Le profil rendu par le serveur (GET, ou réponse d'un PATCH) : les champs partis quittent la file, le téléphone prend
   * les valeurs du serveur sauf pour ceux marqués pendant le voyage. `ajuster` : ce que Mes infos vient d'envoyer.
   */
  async function recevoir(serveur: ProfilServeur, depart: number, envoye: string | null, ajuster?: (p: Profil) => Profil) {
    const gen = generation;
    memoire.etat.aEnvoyer = memoire.etat.aEnvoyer.filter((m) => m.numero > depart);
    const avant = lireProfil();
    if (!avant) return;
    const ancien = memoire.etat.pseudoServeur;
    if (!memoire.etat.premiereFaite) await rattraperPremiereFois(ajuster ? ajuster(avant) : avant, serveur);
    else if (ancien !== undefined && serveur.pseudo && serveur.pseudo !== ancien && serveur.pseudo !== envoye) await expliquerPseudo(ancien, serveur.pseudo, false);
    if (gen !== generation) return;
    // Ville inconnue du serveur (compte du site, envoi raté) : celle du téléphone repart, une fois par lancement
    if (!serveur.ville && !memoire.villeReparee) {
      memoire.villeReparee = true;
      marquer(memoire, ["ville"]);
    }
    await sousVerrou(async () => {
      const ecrit = lireProfil();
      if (gen !== generation || !ecrit) return;
      const local = ajuster ? ajuster(ecrit) : ecrit;
      const fusion = fusionnerProfilServeur(local, serveur, new Set(memoire.etat.aEnvoyer.map((m) => m.champ))) ?? (ajuster ? local : null);
      // Rien de changé : on n'écrit pas (le profil est à la racine, toute l'app se redessinerait)
      if (!fusion || sontProfilsIdentiques(fusion, ecrit)) return;
      await ecrireProfil(fusion);
      if (fusion.prenom !== ecrit.prenom) void o.rafraichirCompte();
    });
    if (gen !== generation) return;
    memoire.etat.pseudoServeur = serveur.pseudo;
    memoire.etat.luLe = Date.now();
    garder();
  }

  /** Un refus définitif : le champ en cause quitte la file, la valeur du serveur est relue, le reste repart */
  function refuserEnArrierePlan(r: Parameters<typeof trierRefusProfil>[0], partis: ChampSynchro[], depart: number) {
    const { retirer, annonce } = trierRefusProfil(r, partis);
    oublierMarques(memoire, retirer, depart);
    if (annonce) memoire.etat.annonce = annonce;
    memoire.relire = true;
    garder();
  }

  async function pomper() {
    const gen = generation;
    for (let tour = 0; tour < TOURS_MAX; tour++) {
      if (gen !== generation || !actif || memoire.infosEnAttente > 0) return;
      const patience = memoire.pasAvant - Date.now();
      if (patience > 0) {
        arreterMinuterie();
        minuterie = setTimeout(lancer, patience);
        return;
      }
      const local = lireProfil();
      const partis = memoire.etat.aEnvoyer.map((m) => m.champ);
      if (!local || (partis.length === 0 && !memoire.relire)) return;
      memoire.relire = false;
      const depart = memoire.numero;
      const r = partis.length > 0 ? await o.comptes.modifierProfil(preparerModificationsProfil(local, partis)) : await o.comptes.lireProfil();
      if (gen !== generation) return;
      if (r.ok) {
        memoire.essais = 0;
        memoire.echecsServeur = 0;
        await recevoir(r.profil, depart, partis.includes("pseudo") ? (local.pseudo ?? null) : null);
        continue;
      }
      // Session expirée : utiliserFinDeSession efface tout, synchro comprise
      if (r.erreur === "connexion-requise") return;
      if (PASSAGERES.has(r.erreur)) {
        if (partis.length === 0) memoire.relire = true;
        return patienter(r.erreur, r.details);
      }
      memoire.essais = 0;
      memoire.echecsServeur = 0;
      if (partis.length === 0) return;
      refuserEnArrierePlan(r, partis, depart);
    }
  }

  /** Écrit sur le téléphone ; `aEnvoyer` : avec la marque « à envoyer » (posée dans le verrou, avant toute fusion) */
  function ecrireSurTelephone(changements: ChangementsInfos, aEnvoyer: boolean) {
    return sousVerrou(async () => {
      const local = lireProfil();
      if (!local) return;
      await ecrireProfil(appliquerChangementsInfos(local, changements));
      if (!aEnvoyer) return;
      marquer(memoire, champsDe(changements));
      garder();
    });
  }

  /** Mes infos, au couloir : un PATCH avec ce qui change et ce qui attendait déjà */
  async function envoyerInfos(changements: ChangementsInfos): Promise<ResultatInfos> {
    const gen = generation;
    const demandes = champsDe(changements);
    for (let essai = 0; essai < 3; essai++) {
      const local = lireProfil();
      if (gen !== generation || !actif || !local) return { ok: false, refus: "connexion-requise" };
      const enFile = memoire.etat.aEnvoyer.map((m) => m.champ);
      const champs = [...demandes, ...enFile];
      const ajuster = (p: Profil) => appliquerChangementsInfos(p, changements);
      const depart = memoire.numero;
      const r = await o.comptes.modifierProfil(preparerModificationsProfil(ajuster(local), champs));
      if (gen !== generation) return { ok: false, refus: "connexion-requise" };
      if (r.ok) {
        memoire.essais = 0;
        memoire.echecsServeur = 0;
        await recevoir(r.profil, depart, champs.includes("pseudo") ? (ajuster(local).pseudo ?? null) : null, ajuster);
        return { ok: true, parti: true };
      }
      if (r.erreur === "connexion-requise") return { ok: false, refus: r.erreur };
      if (PASSAGERES.has(r.erreur)) {
        // Un nouveau pseudo doit être vérifié par le serveur : il n'attend jamais sur le téléphone
        if (changements.pseudo !== undefined) return { ok: false, refus: "pseudo-sans-reseau" };
        await ecrireSurTelephone(changements, true);
        patienter(r.erreur, r.details);
        return { ok: true, parti: false };
      }
      memoire.essais = 0;
      memoire.echecsServeur = 0;
      // Refus d'un champ qui attendait déjà, pas de ce que tu viens de changer : traité comme en arrière-plan, puis on renvoie
      const champ = r.champ as ChampSynchro | undefined;
      const surLaFile =
        (r.erreur === "champ-invalide" && champ !== undefined && enFile.includes(champ) && !demandes.includes(champ)) ||
        (r.erreur === "compte-limite" && changements.prenom === undefined && changements.pseudo === undefined && enFile.some((c) => c === "prenom" || c === "pseudo")) ||
        (r.erreur === "pseudo-pris" && changements.pseudo === undefined && enFile.includes("pseudo"));
      if (surLaFile) {
        refuserEnArrierePlan(r, enFile, depart);
        continue;
      }
      if (r.erreur === "pseudo-pris") {
        // Relu en arrière-plan une fois Mes infos servie (lancer, à la fin de modifierInfos)
        memoire.relire = true;
        return { ok: false, refus: changements.pseudo !== undefined && changements.pseudo === lireMisDeCote() ? "pseudo-mis-de-cote" : "pseudo-pris" };
      }
      return { ok: false, refus: r.erreur, ...(r.champ ? { champ: r.champ } : {}), ...(r.details ? { details: r.details } : {}) };
    }
    return { ok: false, refus: "erreur-serveur" };
  }

  return {
    /** Au montage : l'état gardé sur le téléphone (des marques posées avant passent après les siennes) */
    charger() {
      const m = memoire;
      void lireSynchroProfil().then((etat) => {
        if (m !== memoire || m.pret) return;
        const avant = m.etat.aEnvoyer.map((x) => x.champ);
        m.etat = etat;
        m.numero = etat.aEnvoyer.reduce((max, x) => Math.max(max, x.numero), 0);
        marquer(m, avant);
        m.pret = true;
        garder(avant.length > 0);
        suivrePseudo();
        if (actif) {
          m.relire = true;
          lancer();
        }
      });
    },
    arreter() {
      actif = false;
      generation += 1;
      arreterMinuterie();
    },
    /** Compte connecté hors démo, avec un profil : la synchro tourne ; sinon, aucune demande */
    activer(oui: boolean) {
      if (oui === actif) return;
      actif = oui;
      generation += 1;
      arreterMinuterie();
      if (!oui) return;
      Object.assign(memoire, { relire: true, essais: 0, echecsServeur: 0 });
      lancer();
    },
    auPremierPlan() {
      if (!actif) return;
      if (Date.now() - memoire.etat.luLe > RELECTURE_MS) memoire.relire = true;
      if (!memoire.relire && memoire.etat.aEnvoyer.length === 0) return;
      Object.assign(memoire, { essais: 0, echecsServeur: 0 });
      lancer();
    },
    /** Un nouveau profil complet (inscription, connexion, reprise) : rien ne part, rien n'attend, plus de rattrapage */
    async installer(nouveau: Profil) {
      generation += 1;
      arreterMinuterie();
      memoire = { ...memoireVide(creerSynchroProfil(true)), pret: true };
      await sousVerrou(() => ecrireProfil(nouveau));
      garder();
      if (actif) {
        memoire.relire = true;
        lancer();
      }
    },
    /** Tout oublier (avant d'effacer le profil) : les réponses en route sont ignorées, l'écriture en cours finit d'abord */
    async oublier() {
      generation += 1;
      arreterMinuterie();
      memoire = { ...memoireVide(), pret: true };
      await sousVerrou(effacerSynchroProfil);
      garder(false);
    },
    modifierInfos(changements: ChangementsInfos): Promise<ResultatInfos> {
      if (rienAChanger(changements)) return Promise.resolve({ ok: true, parti: true });
      if (DEMO_VISITES_ACTIVE) return ecrireSurTelephone(changements, false).then(() => ({ ok: true, parti: false }));
      if (!actif || !memoire.pret) {
        // Tout début du lancement (session ou état pas encore relus) : le pseudo attend le réseau, le reste attend ici
        if (changements.pseudo !== undefined) return Promise.resolve({ ok: false, refus: "pseudo-sans-reseau" });
        return ecrireSurTelephone(changements, true).then(() => ({ ok: true, parti: false }));
      }
      const m = memoire;
      m.infosEnAttente += 1;
      return enchainer(() => envoyerInfos(changements), "couloir").finally(() => {
        m.infosEnAttente -= 1;
        lancer();
      });
    },
    /** Mes envies : tout de suite sur le téléphone (régimes compris) ; avec un compte, elles partent ensuite */
    async modifierEnvies(envies: Profil["envies"]) {
      await sousVerrou(async () => {
        const local = lireProfil();
        if (!local) return;
        await ecrireProfil({ ...local, envies });
        if (DEMO_VISITES_ACTIVE) return;
        marquer(memoire, ["envies"]);
        garder();
      });
      lancer();
    },
    fermerAnnonce() {
      if (!memoire.etat.annonce) return;
      memoire.etat.annonce = null;
      garder();
    },
    /** Le profil lu au démarrage, ou plus de profil (effacé) : rien n'est écrit sur le téléphone */
    poserProfil,
  };
}
