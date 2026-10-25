import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
import { FORME_NOM_IMAGE_LIEU, type ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import { ecrireAdresseImageLieu } from "../../../../packages/commun/src/fonctions/lieux/ecrire-adresse-image-lieu.ts";
import { preparerImageLieu } from "../fonctions/lieux/preparer-image-lieu.ts";
import type { NettoyerJpeg } from "./nettoyeur-jpeg.ts";
import {
  DELAI_ORPHELIN_IMAGE_LIEU_MS, IMAGES_LIEU_PAR_PASSAGE_DE_MENAGE,
  type DependancesImagesLieu, type ImagesDuLieu, type RefusImageLieu,
} from "./images-lieu-regles.ts";

export type ImagesLieu = ReturnType<typeof creerImagesLieu>;

type IssueChangement = { avant: ImagesDuLieu } | { refus: "lieu-inconnu" };

const quelleDuNom = (nom: string): ImageLieu => (nom.endsWith(".png") ? "logo" : "banniere");

export function creerImagesLieu({ stockages, depot, lireRole, horloge = Date.now }: DependancesImagesLieu, nettoyer?: NettoyerJpeg) {
  const maintenant = () => new Date(horloge());

  async function exigerGerant(compteId: number, lieuId: number): Promise<RefusImageLieu | null> {
    const role = await lireRole(compteId, lieuId);
    if (role === "gerant") return null;
    return { ok: false, erreur: role === null ? "role-requis" : "reserve-au-gerant" };
  }

  async function changerImage(lieuId: number, quelle: ImageLieu, nouvelle: string | null): Promise<IssueChangement> {
    const issue = await depot.ecrire(async (t): Promise<IssueChangement> => {
      const avant = await t.verrouillerLieu(lieuId);
      if (!avant) return { refus: "lieu-inconnu" };
      if (avant[quelle] !== nouvelle) await t.ecrireImage(lieuId, quelle, nouvelle, maintenant());
      return { avant };
    });
    const ancienne = "avant" in issue ? issue.avant[quelle] : null;
    if (ancienne && ancienne !== nouvelle) await stockages[quelle].supprimer([ancienne]).catch(() => 0);
    return issue;
  }

  return {
    async envoyer(compteId: number, lieuId: number, quelle: ImageLieu, octets: Uint8Array): Promise<{ ok: true; adresse: string } | RefusImageLieu> {
      const refus = await exigerGerant(compteId, lieuId);
      if (refus) return refus;
      const preparee = await preparerImageLieu(quelle, octets, nettoyer);
      if (!preparee.ok) return preparee;
      const stockage = stockages[quelle];
      if (!((await stockage.lirePartLibre()) >= PART_LIBRE_MIN_DISQUE)) return { ok: false, erreur: "stockage-plein" };
      const nom = stockage.tirerNom();
      await stockage.ecrire(nom, preparee.octets, { compteId, deposeLe: maintenant() });
      let issue: IssueChangement;
      try {
        issue = await changerImage(lieuId, quelle, nom);
      } catch (erreur) {
        await stockage.supprimer([nom]).catch(() => 0);
        throw erreur;
      }
      if ("refus" in issue) {
        await stockage.supprimer([nom]).catch(() => 0);
        return { ok: false, erreur: issue.refus };
      }
      return { ok: true, adresse: ecrireAdresseImageLieu(nom)! };
    },

    async retirer(compteId: number, lieuId: number, quelle: ImageLieu): Promise<{ ok: true; retiree: boolean } | RefusImageLieu> {
      const refus = await exigerGerant(compteId, lieuId);
      if (refus) return refus;
      const issue = await changerImage(lieuId, quelle, null);
      if ("refus" in issue) return { ok: false, erreur: issue.refus };
      return { ok: true, retiree: issue.avant[quelle] !== null };
    },

    async retirerParEquipe(lieuId: number, quelle: ImageLieu): Promise<{ ok: true; retiree: boolean } | RefusImageLieu> {
      const issue = await changerImage(lieuId, quelle, null);
      if ("refus" in issue) return { ok: false, erreur: issue.refus };
      return { ok: true, retiree: issue.avant[quelle] !== null };
    },

    async lirePublique(nom: string): Promise<{ octets: Buffer; type: "image/jpeg" | "image/png" } | null> {
      if (!FORME_NOM_IMAGE_LIEU.test(nom)) return null;
      const lieu = await depot.lireLieuDeLImage(nom);
      if (!lieu?.publie) return null;
      const quelle = quelleDuNom(nom);
      const octets = await stockages[quelle].lire(nom);
      return octets ? { octets, type: quelle === "logo" ? "image/png" : "image/jpeg" } : null;
    },

    async menager(quand = maintenant()): Promise<number> {
      const limite = quand.getTime() - DELAI_ORPHELIN_IMAGE_LIEU_MS;
      let effacees = 0;
      for (const stockage of Object.values(stockages)) {
        let apres: string | null = null;
        for (;;) {
          const paquet = await stockage.lister(apres, IMAGES_LIEU_PAR_PASSAGE_DE_MENAGE);
          if (paquet.length === 0) break;
          apres = paquet[paquet.length - 1]!.photo;
          const vieilles = paquet.filter((p) => p.deposeLe.getTime() < limite).map((p) => p.photo);
          if (vieilles.length === 0) continue;
          const citees = await depot.listerImagesCitees(vieilles);
          effacees += await stockage.supprimer(vieilles.filter((nom) => !citees.has(nom)));
        }
      }
      return effacees;
    },
  };
}
