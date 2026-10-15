import { ecrireAvatarPhoto } from "../../../../packages/commun/src/fonctions/compte/ecrire-avatar-photo.ts";
import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
import { FORME_NOM_PHOTO_PROFIL } from "../../../../packages/commun/src/regles/photo-profil.ts";
import { calculerDebutPreuvePhoto } from "../fonctions/comptes/calculer-debut-preuve-photo.ts";
import { preparerPhotoProfil } from "../fonctions/comptes/preparer-photo-profil.ts";
import { calculerSeuilsMenageSocial } from "../fonctions/social/calculer-seuils-menage-social.ts";
import {
  DELAI_ORPHELIN_PHOTO_PROFIL_MS, PHOTOS_PROFIL_PAR_PASSAGE_DE_MENAGE,
  type DependancesPhotosProfil, type PhotoDuCompte, type PhotoEnvoyee, type PhotoRetiree, type RaisonRetraitPhoto, type RefusPhotoProfil,
  type TransactionPhotosProfil,
} from "./photos-profil-regles.ts";

type IssueChangement = { avant: PhotoDuCompte } | { refus: "compte-inconnu" | "chiffrement-indisponible" };

export type PhotosProfil = ReturnType<typeof creerPhotosProfil>;

export function creerPhotosProfil({ stockage, depot, preuves, horloge = Date.now }: DependancesPhotosProfil) {
  const maintenant = () => new Date(horloge());

  async function garderPreuve(t: TransactionPhotosProfil, compteId: number, photo: string, quand: Date): Promise<boolean> {
    const depuis = calculerDebutPreuvePhoto((await stockage.lireFiche(photo))?.deposeLe);
    const signalements = await t.listerSignalementsAGarder(compteId, depuis, calculerSeuilsMenageSocial(quand).fichiersSignales);
    if (signalements.length === 0) return true;
    const chiffrement = preuves?.chiffrement;
    if (!preuves || !chiffrement) return false;
    const octets = await stockage.lire(photo);
    if (!octets) return true;
    const fichier = preuves.medias.tirerNom();
    await preuves.medias.ecrire(fichier, chiffrement.chiffrerOctets(octets, fichier));
    await t.citerPreuve(signalements, fichier);
    return true;
  }

  async function changerPhoto(compteId: number, nouvelle: string | null, quand: Date, sansPreuve = false): Promise<IssueChangement> {
    const issue = await depot.ecrire(async (t): Promise<IssueChangement> => {
      const avant = await t.verrouillerCompte(compteId);
      if (!avant) return { refus: "compte-inconnu" };
      if (avant.photo && !(await garderPreuve(t, compteId, avant.photo, quand)) && !sansPreuve) return { refus: "chiffrement-indisponible" };
      if (avant.photo !== nouvelle) await t.ecrirePhoto(compteId, nouvelle);
      return { avant };
    });
    if ("avant" in issue && issue.avant.photo && issue.avant.photo !== nouvelle) await stockage.supprimer([issue.avant.photo]).catch(() => 0);
    return issue;
  }

  async function oublierEnvoi(photo: string) {
    await stockage.supprimer([photo]).catch(() => 0);
  }

  async function lirePreuve(fichier: string): Promise<Buffer | null> {
    if (!preuves?.chiffrement) return null;
    const chiffre = await preuves.medias.lire(fichier);
    if (!chiffre) return null;
    try {
      return preuves.chiffrement.dechiffrerOctets(chiffre, fichier);
    } catch {
      return null;
    }
  }

  return {
    async envoyer(compteId: number, octets: Uint8Array): Promise<PhotoEnvoyee | RefusPhotoProfil> {
      const preparee = preparerPhotoProfil(octets);
      if (!preparee.ok) return preparee;
      if (!((await stockage.lirePartLibre()) >= PART_LIBRE_MIN_DISQUE)) return { ok: false, erreur: "stockage-plein" };
      const quand = maintenant();
      const photo = stockage.tirerNom();
      await stockage.ecrire(photo, preparee.octets, { compteId, deposeLe: quand });
      let issue: IssueChangement;
      try {
        issue = await changerPhoto(compteId, photo, quand);
      } catch (erreur) {
        await oublierEnvoi(photo);
        throw erreur;
      }
      if ("refus" in issue) {
        await oublierEnvoi(photo);
        return { ok: false, erreur: issue.refus };
      }
      return { ok: true, avatar: ecrireAvatarPhoto(photo) };
    },

    async retirer(compteId: number, raison: RaisonRetraitPhoto): Promise<PhotoRetiree | RefusPhotoProfil> {
      const issue = await changerPhoto(compteId, null, maintenant(), raison === "compte-supprime");
      if ("refus" in issue) return { ok: false, erreur: issue.refus };
      return { ok: true, avatar: issue.avant.avatar, retiree: issue.avant.photo !== null };
    },

    async lirePublique(photo: string, lecteurId: number | null): Promise<Buffer | null> {
      if (!FORME_NOM_PHOTO_PROFIL.test(photo)) return null;
      const titulaire = await depot.lireTitulaire(photo, maintenant());
      if (!titulaire || titulaire.limite) return null;
      if (lecteurId !== null && lecteurId !== titulaire.compteId && (await depot.bloqueEntre(lecteurId, titulaire.compteId))) return null;
      return stockage.lire(photo);
    },

    async lirePhotoDuSignalement(signalementId: number): Promise<Buffer | null> {
      const signalement = await depot.lireSignalementDeProfil(signalementId);
      if (!signalement) return null;
      if (signalement.fichierMedia) return lirePreuve(signalement.fichierMedia);
      const photo = signalement.auteurContenuId === null ? null : await depot.lirePhoto(signalement.auteurContenuId);
      if (!photo) return null;
      const debut = calculerDebutPreuvePhoto((await stockage.lireFiche(photo))?.deposeLe);
      return debut.getTime() <= signalement.creeLe.getTime() ? stockage.lire(photo) : null;
    },

    async menager(quand = maintenant()): Promise<number> {
      const limite = quand.getTime() - DELAI_ORPHELIN_PHOTO_PROFIL_MS;
      let effacees = 0;
      let apres: string | null = null;
      for (;;) {
        const paquet = await stockage.lister(apres, PHOTOS_PROFIL_PAR_PASSAGE_DE_MENAGE);
        if (paquet.length === 0) return effacees;
        apres = paquet[paquet.length - 1]!.photo;
        const vieilles = paquet.filter((p) => p.deposeLe.getTime() < limite).map((p) => p.photo);
        if (vieilles.length === 0) continue;
        const citees = await depot.listerPhotosCitees(vieilles);
        effacees += await stockage.supprimer(vieilles.filter((photo) => !citees.has(photo)));
      }
    },
  };
}

let photosBranchees: PhotosProfil | null = null;

export function brancherPhotosProfil(photos: PhotosProfil | null): void {
  photosBranchees = photos;
}

export async function retirerPhotoProfil(compteId: number, raison: RaisonRetraitPhoto): Promise<PhotoRetiree | RefusPhotoProfil | null> {
  return photosBranchees ? photosBranchees.retirer(compteId, raison) : null;
}

export async function lirePhotoProfilSignalee(signalementId: number): Promise<Buffer | null> {
  return photosBranchees ? photosBranchees.lirePhotoDuSignalement(signalementId) : null;
}
