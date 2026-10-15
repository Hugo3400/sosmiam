// La synchro du profil d'un compte connecté, sans React : le serveur fait foi, le téléphone garde une copie pour s'ouvrir
// hors ligne et ne gagne que pour un champ changé ici, pas encore parti (marque « à envoyer »). Les régimes ne partent
// jamais (RGPD, article 9) ; la date de naissance non plus (seule l'équipe la corrige). Contrat : PATCH et GET /comptes/moi/profil
// (packages/commun/src/client-api/contrat-compte.ts), un refus n'y écrit rien.
import type { ServiceCompte } from "@sos-miam/commun/client-api/contrat-compte";
import type { ServiceModerationApp } from "@sos-miam/commun/client-api/contrat-moderation-app";
import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ProfilServeur } from "@sos-miam/commun/types/compte-app";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Profil } from "@sos-miam/commun/types/profil";
import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import { appliquerChangementsInfos } from "~/fonctions/compte/appliquer-changements-infos";
import { fusionnerProfilServeur } from "~/fonctions/compte/fusionner-profil-serveur";
import { listerChampsDifferents } from "~/fonctions/compte/lister-champs-differents";
import { preparerModificationsProfil } from "~/fonctions/compte/preparer-modifications-profil";
import { sontProfilsIdentiques } from "~/fonctions/compte/sont-profils-identiques";
import { trierRefusProfil } from "~/fonctions/compte/trier-refus-profil";
import type { ChangementsInfos, ResultatInfos } from "~/hooks/utiliser-profil";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { creerExplicationPseudo } from "~/services/synchro-profil-pseudo";
import { creerCopieAvatar } from "~/services/synchro-profil-avatar";
import { creerChoixAvatar } from "~/services/synchro-profil-choix-avatar";
import { choisirOperationPhoto, creerPhotoSynchro } from "~/services/synchro-profil-photo";
import type { Avatar } from "~/stockage/avatar-local";
import { enregistrerProfilLocal } from "~/stockage/profil-local";
import {
  ATTENTES_MS,
  ECHECS_SERVEUR_MAX,
  PASSAGERES,
  RELECTURE_MS,
  TOURS_MAX,
  champsDe,
  marquer,
  memoireVide,
  oublierMarques,
  rienAChanger,
  type EtatPhotoSynchro,
  type VueSynchro,
} from "~/services/synchro-profil-memoire";
import { creerSynchroProfil, effacerSynchroProfil, enregistrerSynchroProfil, lireSynchroProfil, type ChampSynchro } from "~/stockage/synchro-profil";

export type { EtatPhotoSynchro, VueSynchro };

export type OutilsSynchro = {
  comptes: ServiceCompte;
  moderation: ServiceModerationApp;
  rafraichirCompte: () => Promise<void>;
  /** Met le profil à l'écran (le moteur garde la copie à jour, relue au retour de chaque réponse) */
  afficherProfil: (profil: Profil | null) => void;
  /** Met l'avatar à l'écran (gardé à part du profil ; le moteur en garde aussi la copie à jour) */
  afficherAvatar: (avatar: Avatar) => void;
  montrer: (vue: VueSynchro) => void;
  montrerPhoto?: (etat: EtatPhotoSynchro | null) => void;
};

/**
 * Le moteur de la synchro du profil d'un compte connecté (branché par utiliserSynchroProfil) : une seule demande à la fois
 * (le couloir : Mes infos attend la fin d'un envoi en cours), les écritures du profil l'une après l'autre (le verrou : une
 * fusion ne passe jamais sur des envies cochées pendant le voyage). Démo : tout reste sur le téléphone.
 */
export function creerMoteurSynchroProfil(o: OutilsSynchro) {
  // Le profil à jour, même entre deux rendus (celui de l'écran le suit) ; l'avatar aussi, à part
  let profil: Profil | null = null;
  const avatar = creerCopieAvatar(o.afficherAvatar);
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
  const montrerPhoto = (etat: EtatPhotoSynchro | null) => o.montrerPhoto?.(etat);

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
    // « Prénom limité » : plus rien à dire une fois la limitation finie (jamais de date passée à l'écran)
    const annonce = memoire.etat.annonce;
    if (annonce?.type === "prenom-limite" && annonce.jusqua && !(Date.parse(annonce.jusqua) > Date.now())) memoire.etat.annonce = null;
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

  const outilsAvatar = { lireMemoire: () => memoire, sousVerrou, lireAvatar: avatar.lire, ecrireAvatar: avatar.ecrire, garder, lancer };
  const photos = creerPhotoSynchro({ ...outilsAvatar, lireComptes: () => o.comptes, lireGeneration: () => generation, montrer: montrerPhoto });
  const choix = creerChoixAvatar({ ...outilsAvatar, lireProfil, marquerAvantEcriture, oublierAttentePhoto: photos.oublierAttente, montrerPhoto });

  function arreterTout() {
    arreterMinuterie();
    photos.arreter();
  }

  const expliquerPseudo = creerExplicationPseudo({
    listerDecisions: () => o.moderation.listerDecisions(),
    lireGeneration: () => generation,
    lireMemoire: () => memoire,
    sousVerrou,
    garder,
    suivrePseudo,
  });

  /** Téléphone d'avant la synchro : ce qui diffère vient de Mes infos ou Mes envies, jamais parti. Le téléphone gagne, une fois */
  function rattraperPremiereFois(local: Profil, serveur: ProfilServeur) {
    marquer(memoire, listerChampsDifferents(local, serveur));
    // Pseudo jamais parti alors que le serveur n'en a aucun : il part (seule exception à « le serveur fait foi »)
    if (local.pseudo && serveur.pseudo === null) marquer(memoire, ["pseudo"]);
    else if (local.pseudo && serveur.pseudo && local.pseudo !== serveur.pseudo) expliquerPseudo(local.pseudo, serveur.pseudo, true);
    memoire.etat.premiereFaite = true;
  }

  /**
   * Le profil rendu par le serveur (GET, ou réponse d'un PATCH) : les champs partis quittent la file, le téléphone prend
   * les valeurs du serveur sauf pour ceux marqués pendant le voyage. `ajuster` : ce que Mes infos vient d'envoyer.
   */
  async function recevoir(serveur: ProfilServeur, depart: number, envoye: string | null, ajuster?: (p: Profil) => Profil, retenus: ChampSynchro[] = []) {
    const gen = generation;
    memoire.etat.aEnvoyer = memoire.etat.aEnvoyer.filter((m) => m.numero > depart || retenus.includes(m.champ));
    const avant = lireProfil();
    if (!avant) return;
    const ancien = memoire.etat.pseudoServeur;
    // Avant que le rattrapage pose premiereFaite : un avatar jamais lu sur ce téléphone part s'il manque au serveur (un
    // refus du serveur, lui, rend sa valeur)
    const rattrapageAvatar = (!memoire.etat.premiereFaite || memoire.etat.avatarServeur === undefined) && !memoire.avatarRefuse;
    if (!memoire.etat.premiereFaite) rattraperPremiereFois(ajuster ? ajuster(avant) : avant, serveur);
    else if (ancien !== undefined && serveur.pseudo && serveur.pseudo !== ancien && serveur.pseudo !== envoye) expliquerPseudo(ancien, serveur.pseudo, false);
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
      if (fusion && !sontProfilsIdentiques(fusion, ecrit)) {
        await ecrireProfil(fusion);
        if (fusion.prenom !== ecrit.prenom) void o.rafraichirCompte();
      }
      if (gen === generation) await avatar.recevoir(memoire, serveur.avatar, rattrapageAvatar);
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
    if (retirer.includes("avatar") && partis.includes("avatar")) memoire.avatarRefuse = true;
    if (annonce) memoire.etat.annonce = annonce;
    memoire.relire = true;
    garder();
  }

  /** Ce qui part, relu sous le verrou (après toute écriture en cours, avec ses marques) */
  const prendreInstantane = () =>
    sousVerrou(async () => {
      const photo = choisirOperationPhoto(memoire, avatar.lire());
      const champs = memoire.etat.aEnvoyer.map((m) => m.champ);
      const partis = photo ? champs.filter((c) => c !== "avatar") : champs;
      const retenus: ChampSynchro[] = photo ? ["avatar"] : [];
      return { local: lireProfil(), partis, retenus, depart: memoire.numero, avatarPublic: avatar.enPublic(), photo };
    });

  function suivrePhotoRestee(partis: ChampSynchro[], avatarPublic: string | null, serveur: ProfilServeur) {
    if (partis.includes("avatar") && avatarPublic !== null && lireAvatarPhoto(serveur.avatar)) marquer(memoire, ["avatar"]);
  }

  async function pomper() {
    const gen = generation;
    let photoSautee = false;
    for (let tour = 0; tour < TOURS_MAX; tour++) {
      if (gen !== generation || !actif || memoire.infosEnAttente > 0) return;
      const patience = memoire.pasAvant - Date.now();
      if (patience > 0) {
        arreterMinuterie();
        minuterie = setTimeout(lancer, patience);
        return;
      }
      // L'instantané de ce qui part est pris sous le verrou : jamais entre une marque et l'écriture qu'elle annonce (sinon
      // l'ancienne valeur partirait avec une marque déjà comptée, et la réponse effacerait le nouveau choix)
      const { local, partis, retenus, depart, avatarPublic, photo } = await prendreInstantane();
      if (gen !== generation || !actif || memoire.infosEnAttente > 0) return;
      if (local && photo && !photoSautee && Date.now() >= memoire.photoPasAvant) {
        const fin = await photos.executer(photo);
        if (fin === "fin") return;
        photoSautee = fin === "attente";
        continue;
      }
      if (!local || (partis.length === 0 && !memoire.relire)) return;
      memoire.relire = false;
      const corps = partis.length > 0 ? preparerModificationsProfil(local, partis, avatarPublic) : null;
      // Rien à écrire (une marque d'avatar restée avec une photo, qui ne part jamais) : une simple lecture, qui l'efface
      const r = corps && Object.keys(corps).length > 0 ? await o.comptes.modifierProfil(corps) : await o.comptes.lireProfil();
      if (gen !== generation) return;
      if (r.ok) {
        memoire.essais = 0;
        memoire.echecsServeur = 0;
        suivrePhotoRestee(partis, avatarPublic, r.profil);
        await recevoir(r.profil, depart, partis.includes("pseudo") ? (local.pseudo ?? null) : null, undefined, retenus);
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

  /**
   * Un changement à toi : la marque « à envoyer » est gardée sur le téléphone AVANT le profil (app tuée entre les deux :
   * une marque en trop ne fait que renvoyer la valeur du téléphone, une marque manquante perdrait le changement) ; nouvel
   * essai tout de suite, puis 30 s (pas les 10 min d'une longue panne)
   */
  async function marquerAvantEcriture(champs: ChampSynchro[]) {
    marquer(memoire, champs);
    Object.assign(memoire, { essais: 0, echecsServeur: 0 });
    garder(false);
    if (memoire.pret) await enregistrerSynchroProfil(memoire.etat).catch(() => undefined);
  }

  /** Écrit sur le téléphone ; `aEnvoyer` : avec la marque « à envoyer » (posée dans le verrou, avant toute fusion) */
  function ecrireSurTelephone(changements: ChangementsInfos, aEnvoyer: boolean) {
    return sousVerrou(async () => {
      const local = lireProfil();
      if (!local) return;
      if (aEnvoyer) await marquerAvantEcriture(champsDe(changements));
      await ecrireProfil(appliquerChangementsInfos(local, changements));
    });
  }

  /** Mes infos, au couloir : un PATCH avec ce qui change et ce qui attendait déjà */
  async function envoyerInfos(changements: ChangementsInfos): Promise<ResultatInfos> {
    const gen = generation;
    const demandes = champsDe(changements);
    for (let essai = 0; essai < 3; essai++) {
      const { local, partis: enFile, retenus, depart, avatarPublic } = await prendreInstantane();
      if (gen !== generation || !actif || !local) return { ok: false, refus: "connexion-requise" };
      const champs = [...demandes, ...enFile];
      const ajuster = (p: Profil) => appliquerChangementsInfos(p, changements);
      const r = await o.comptes.modifierProfil(preparerModificationsProfil(ajuster(local), champs, avatarPublic));
      if (gen !== generation) return { ok: false, refus: "connexion-requise" };
      if (r.ok) {
        memoire.essais = 0;
        memoire.echecsServeur = 0;
        suivrePhotoRestee(champs, avatarPublic, r.profil);
        await recevoir(r.profil, depart, champs.includes("pseudo") ? (ajuster(local).pseudo ?? null) : null, ajuster, retenus);
        return { ok: true, parti: true };
      }
      if (r.erreur === "connexion-requise") return { ok: false, refus: r.erreur };
      if (PASSAGERES.has(r.erreur)) {
        // Un nouveau pseudo doit être vérifié par le serveur : il n'attend jamais sur le téléphone. Sans réseau, on le dit
        // sous la case ; un pépin du serveur (trop de demandes, panne) se dit tel quel, et le profil est relu ensuite (une
        // erreur 500 peut arriver après l'écriture, pendant la relecture du serveur)
        if (changements.pseudo !== undefined) {
          if (r.erreur === "hors-ligne") return { ok: false, refus: "pseudo-sans-reseau" };
          memoire.relire = true;
          return { ok: false, refus: r.erreur, ...(r.details ? { details: r.details } : {}) };
        }
        await ecrireSurTelephone(changements, true);
        patienter(r.erreur, r.details);
        return { ok: true, parti: false, attente: r.erreur === "hors-ligne" ? "reseau" : "serveur" };
      }
      memoire.essais = 0;
      memoire.echecsServeur = 0;
      // Refus d'un champ qui attendait déjà, pas de ce que tu viens de changer : traité comme en arrière-plan, puis on renvoie
      const champ = r.champ as ChampSynchro | undefined;
      const surLaFile =
        (r.erreur === "champ-invalide" && champ !== undefined && enFile.includes(champ) && !demandes.includes(champ)) ||
        (r.erreur === "compte-limite" &&
          changements.prenom === undefined &&
          changements.pseudo === undefined &&
          enFile.some((c) => c === "prenom" || c === "pseudo" || c === "avatar")) ||
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
      arreterTout();
    },
    /** Compte connecté hors démo, avec un profil : la synchro tourne ; sinon, aucune demande */
    activer(oui: boolean) {
      if (oui === actif) return;
      actif = oui;
      generation += 1;
      arreterTout();
      if (!oui) return;
      Object.assign(memoire, { relire: true, essais: 0, echecsServeur: 0, photoEssais: 0, photoEchecs: 0 });
      lancer();
    },
    auPremierPlan() {
      if (!actif) return;
      if (Date.now() - memoire.etat.luLe > RELECTURE_MS) memoire.relire = true;
      if (!memoire.relire && memoire.etat.aEnvoyer.length === 0) return;
      Object.assign(memoire, { essais: 0, echecsServeur: 0, photoEssais: 0, photoEchecs: 0 });
      lancer();
    },
    /** Un nouveau profil complet (inscription, connexion, reprise) : rien ne part, rien n'attend, plus de rattrapage */
    async installer(nouveau: Profil) {
      generation += 1;
      arreterTout();
      montrerPhoto(null);
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
      arreterTout();
      montrerPhoto(null);
      memoire = { ...memoireVide(), pret: true };
      await sousVerrou(effacerSynchroProfil);
      garder(false);
    },
    modifierInfos(changements: ChangementsInfos): Promise<ResultatInfos> {
      if (rienAChanger(changements)) return Promise.resolve({ ok: true, parti: true });
      // Démo : enregistré pour de bon sur le téléphone, rien n'attend le réseau
      if (DEMO_VISITES_ACTIVE) return ecrireSurTelephone(changements, false).then(() => ({ ok: true, parti: true }));
      if (!actif || !memoire.pret) {
        // Tout début du lancement (session ou état pas encore relus) : le pseudo attend le réseau, le reste attend ici
        if (changements.pseudo !== undefined) return Promise.resolve({ ok: false, refus: "pseudo-sans-reseau" });
        return ecrireSurTelephone(changements, true).then(() => ({ ok: true, parti: false, attente: "reseau" }));
      }
      const m = memoire;
      m.infosEnAttente += 1;
      // Gardé sur le téléphone faute de réseau : le prochain essai est déjà prévu (30 s), pas de deuxième envoi aussitôt
      let essaiPrevu = false;
      return enchainer(async () => {
        const r = await envoyerInfos(changements);
        essaiPrevu = r.ok && !r.parti;
        return r;
      }, "couloir").finally(() => {
        m.infosEnAttente -= 1;
        if (!essaiPrevu) lancer();
      });
    },
    /** Mes envies : tout de suite sur le téléphone (régimes compris) ; avec un compte, elles partent ensuite */
    async modifierEnvies(envies: Profil["envies"]) {
      await sousVerrou(async () => {
        const local = lireProfil();
        if (!local) return;
        if (!DEMO_VISITES_ACTIVE) await marquerAvantEcriture(["envies"]);
        await ecrireProfil({ ...local, envies });
      });
      lancer();
    },
    modifierAvatar: choix.modifierAvatar,
    retirerPhoto: choix.retirerPhoto,
    fermerAnnonce() {
      if (!memoire.etat.annonce) return;
      memoire.etat.annonce = null;
      garder();
    },
    /** Le profil lu au démarrage, ou plus de profil (effacé) : rien n'est écrit sur le téléphone */
    poserProfil,
    /** L'avatar lu au démarrage (avant le profil : la synchro ne tourne jamais sans lui), ou remis par défaut (effacé) */
    poserAvatar: avatar.poser,
  };
}
