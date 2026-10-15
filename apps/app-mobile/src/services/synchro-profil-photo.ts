import type { ServiceCompte } from "@sos-miam/commun/client-api/contrat-compte";
import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import { lireAvatarPublic } from "~/fonctions/compte/lire-avatar-public";
import {
  ATTENTE_STOCKAGE_PLEIN_MS,
  ATTENTES_MS,
  ECHECS_SERVEUR_MAX,
  PASSAGERES,
  marquer,
  oublierMarques,
  type EtatPhotoSynchro,
  type Memoire,
  type OperationPhotoSynchro,
} from "~/services/synchro-profil-memoire";
import { AVATAR_PAR_DEFAUT, lireOctetsPhotoAvatar, type Avatar } from "~/stockage/avatar-local";

export type OperationPhoto = { type: "envoyer"; uri: string; numero: number } | { type: "retirer" | "retirer-avant"; numero: number };

export type FinOperationPhoto = "suite" | "attente" | "fin";

type OutilsPhoto = {
  lireComptes: () => Pick<ServiceCompte, "envoyerPhotoProfil" | "retirerPhotoProfil">;
  lireGeneration: () => number;
  lireMemoire: () => Memoire;
  sousVerrou: <T>(etape: () => Promise<T>) => Promise<T>;
  lireAvatar: () => Avatar | null;
  ecrireAvatar: (avatar: Avatar) => Promise<void>;
  garder: () => void;
  lancer: () => void;
  montrer: (etat: EtatPhotoSynchro | null) => void;
};

type Echec = { ok: false; erreur: ErreurService; details?: DetailsErreur };

const ATTENTES_PHOTO = new Set<ErreurService>([...PASSAGERES, "stockage-plein"]);

export function choisirOperationPhoto(memoire: Memoire, avatar: Avatar | null): OperationPhoto | null {
  const marque = memoire.etat.aEnvoyer.find((m) => m.champ === "avatar");
  if (!marque || !avatar) return null;
  if (memoire.etat.retraitPhoto) return { type: "retirer", numero: marque.numero };
  if (avatar.type === "photo") return avatar.partage === "a-envoyer" && avatar.uri ? { type: "envoyer", uri: avatar.uri, numero: marque.numero } : null;
  return lireAvatarPhoto(memoire.etat.avatarServeur) ? { type: "retirer-avant", numero: marque.numero } : null;
}

function raisonAttente(erreur: ErreurService): "reseau" | "serveur" | "quota" | "stockage" {
  if (erreur === "hors-ligne") return "reseau";
  if (erreur === "trop-de-demandes") return "quota";
  return erreur === "stockage-plein" ? "stockage" : "serveur";
}

function raisonRefus(erreur: ErreurService): "compte-limite" | "fichier" | "autre" {
  if (erreur === "compte-limite") return "compte-limite";
  return erreur === "format-refuse" || erreur === "media-trop-lourd" || erreur === "media-invalide" ? "fichier" : "autre";
}

export function creerPhotoSynchro(o: OutilsPhoto) {
  let minuterie: ReturnType<typeof setTimeout> | null = null;

  function arreter() {
    if (minuterie) clearTimeout(minuterie);
    minuterie = null;
  }

  function oublierAttente(m: Memoire) {
    arreter();
    Object.assign(m, { photoPasAvant: 0, photoEssais: 0, photoEchecs: 0 });
  }

  const sansChoixPlusRecent = (m: Memoire, numero: number) => !m.etat.aEnvoyer.some((x) => x.champ === "avatar" && x.numero > numero);

  function patienter(m: Memoire, operation: OperationPhotoSynchro, erreur: ErreurService, details?: DetailsErreur) {
    let attente = ATTENTES_MS[Math.min(m.photoEssais, ATTENTES_MS.length - 1)];
    const longue = (erreur === "trop-de-demandes" && !!details?.attenteS) || erreur === "stockage-plein";
    if (erreur === "trop-de-demandes" && details?.attenteS) attente = details.attenteS * 1000;
    else if (erreur === "stockage-plein") attente = ATTENTE_STOCKAGE_PLEIN_MS;
    m.photoEssais += 1;
    m.photoEchecs = erreur === "erreur-serveur" ? m.photoEchecs + 1 : 0;
    if (longue) m.photoPasAvant = Date.now() + attente;
    arreter();
    if (m.photoEchecs < ECHECS_SERVEUR_MAX) minuterie = setTimeout(o.lancer, attente);
    o.montrer({ operation, etat: "attente", raison: raisonAttente(erreur), ...(longue ? { jusqua: m.photoPasAvant } : {}) });
  }

  async function refuser(m: Memoire, op: OperationPhoto, operation: OperationPhotoSynchro, erreur: ErreurService) {
    await o.sousVerrou(async () => {
      oublierMarques(m, ["avatar"], op.numero);
      if (op.type === "retirer" && sansChoixPlusRecent(m, op.numero)) delete m.etat.retraitPhoto;
      m.avatarRefuse = true;
      m.relire = true;
    });
    o.montrer({ operation, etat: "refusee", raison: raisonRefus(erreur) });
    o.garder();
  }

  async function echouer(m: Memoire, op: OperationPhoto, r: Echec): Promise<FinOperationPhoto> {
    const operation: OperationPhotoSynchro = op.type === "envoyer" ? "envoi" : "retrait";
    if (r.erreur === "connexion-requise") return "fin";
    if (ATTENTES_PHOTO.has(r.erreur)) {
      patienter(m, operation, r.erreur, r.details);
      return "attente";
    }
    oublierAttente(m);
    await refuser(m, op, operation, r.erreur);
    return "suite";
  }

  async function envoyer(op: Extract<OperationPhoto, { type: "envoyer" }>, gen: number, m: Memoire): Promise<FinOperationPhoto> {
    o.montrer({ operation: "envoi", etat: "en-cours" });
    const fichier = await lireOctetsPhotoAvatar(op.uri).catch(() => null);
    if (gen !== o.lireGeneration()) return "fin";
    const r = fichier ? await o.lireComptes().envoyerPhotoProfil(fichier) : ({ ok: false, erreur: "media-invalide" } as const);
    if (gen !== o.lireGeneration()) return "fin";
    if (!r.ok) return echouer(m, op, r);
    oublierAttente(m);
    await o.sousVerrou(async () => {
      if (gen !== o.lireGeneration()) return;
      m.etat.avatarServeur = r.avatar;
      const courant = o.lireAvatar();
      if (courant?.type !== "photo" || courant.uri !== op.uri || courant.partage !== "a-envoyer") {
        if (m.etat.aEnvoyer.some((x) => x.champ === "avatar")) return;
        m.etat.retraitPhoto = true;
        return marquer(m, ["avatar"]);
      }
      oublierMarques(m, ["avatar"], op.numero);
      await o.ecrireAvatar({ type: "photo", uri: null, partage: r.avatar }).catch(() => undefined);
    });
    o.montrer(null);
    o.garder();
    return "suite";
  }

  async function retirer(op: OperationPhoto, gen: number, m: Memoire): Promise<FinOperationPhoto> {
    if (op.type === "retirer") o.montrer({ operation: "retrait", etat: "en-cours" });
    const r = await o.lireComptes().retirerPhotoProfil();
    if (gen !== o.lireGeneration()) return "fin";
    if (!r.ok) return echouer(m, op, r);
    oublierAttente(m);
    await o.sousVerrou(async () => {
      if (gen !== o.lireGeneration()) return;
      m.etat.avatarServeur = r.avatar;
      if (op.type !== "retirer" || !sansChoixPlusRecent(m, op.numero)) return;
      delete m.etat.retraitPhoto;
      oublierMarques(m, ["avatar"], op.numero);
      const repli = (r.avatar ? lireAvatarPublic(r.avatar) : null) ?? AVATAR_PAR_DEFAUT;
      await o.ecrireAvatar(repli.type === "photo" ? AVATAR_PAR_DEFAUT : repli).catch(() => undefined);
    });
    o.montrer(null);
    o.garder();
    return "suite";
  }

  return {
    arreter,
    oublierAttente,
    async executer(op: OperationPhoto): Promise<FinOperationPhoto> {
      const gen = o.lireGeneration();
      const m = o.lireMemoire();
      return op.type === "envoyer" ? envoyer(op, gen, m) : retirer(op, gen, m);
    },
  };
}
