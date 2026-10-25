import type { ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { StockagesImagesLieu } from "./images-lieu-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

export type SignalementImageLieuRecu = {
  cible: "image-lieu";
  lieuId: number;
  quelle: ImageLieu;
  raison: string;
  precision: string | null;
  explication: string;
  signaleParId: number | null;
  source: "app" | "site";
};

export type NouveauSignalementImageLieu = Omit<SignalementImageLieuRecu, "cible" | "quelle"> & {
  cibleId: string;
  auteurContenuId: number | null;
  fichierMedia: string | null;
  creeLe: Date;
};

export interface DepotSignalementsImagesLieu {
  lireImagePubliee(lieuId: number, quelle: ImageLieu): Promise<string | null>;
  estDejaSignalee(cibleId: string, signaleParId: number): Promise<boolean>;
  aUnePreuveOuverte(cibleId: string): Promise<boolean>;
  compteExiste(compteId: number): Promise<boolean>;
  ecrire(s: NouveauSignalementImageLieu, instantane: (id: number) => string): Promise<number>;
}

export type DependancesSignalementsImagesLieu = {
  depot: DepotSignalementsImagesLieu;
  stockages: StockagesImagesLieu;
  chiffrement: Pick<ChiffrementSocial, "chiffrerOctets" | "chiffrerInstantane"> | null;
  medias: Pick<StockageMediasChat, "tirerNom" | "ecrire" | "supprimer">;
  horloge?: () => number;
};

export type IssueSignalementImageLieu = "enregistre" | "deja-signalee" | "image-absente" | "chiffrement-indisponible";

export const lireCibleImageLieu = (cibleId: string): { lieuId: number; quelle: ImageLieu } | null => {
  const morceaux = /^([1-9]\d{0,9}):(banniere|logo)$/.exec(cibleId);
  return morceaux ? { lieuId: Number(morceaux[1]), quelle: morceaux[2] as ImageLieu } : null;
};

export function creerSignalementsImagesLieu({ depot, stockages, chiffrement, medias, horloge = Date.now }: DependancesSignalementsImagesLieu) {
  return {
    async enregistrer(s: SignalementImageLieuRecu): Promise<IssueSignalementImageLieu> {
      const nom = await depot.lireImagePubliee(s.lieuId, s.quelle);
      if (!nom) return "image-absente";
      if (!chiffrement) return "chiffrement-indisponible";
      const cibleId = `${s.lieuId}:${s.quelle}`;
      if (s.signaleParId !== null && (await depot.estDejaSignalee(cibleId, s.signaleParId))) return "deja-signalee";
      const stockage = stockages[s.quelle];
      const typeMime = s.quelle === "logo" ? "image/png" : "image/jpeg";
      let fichierMedia: string | null = null;
      if (!(await depot.aUnePreuveOuverte(cibleId))) {
        const octets = await stockage.lire(nom);
        if (!octets) return "image-absente";
        fichierMedia = medias.tirerNom();
        await medias.ecrire(fichierMedia, chiffrement.chiffrerOctets(octets, fichierMedia));
      }
      const deposant = (await stockage.lireFiche(nom))?.compteId ?? null;
      const auteurContenuId = deposant !== null && (await depot.compteExiste(deposant)) ? deposant : null;
      const instantane = JSON.stringify({ v: 1, cible: "image-lieu", lieuId: s.lieuId, quelle: s.quelle, nom, media: { typeMime } });
      try {
        await depot.ecrire(
          { lieuId: s.lieuId, cibleId, raison: s.raison, precision: s.precision, explication: s.explication, source: s.source, signaleParId: s.signaleParId, auteurContenuId, fichierMedia, creeLe: new Date(horloge()) },
          (id) => chiffrement.chiffrerInstantane(instantane, id),
        );
      } catch (erreur) {
        if (fichierMedia) await medias.supprimer([fichierMedia]).catch(() => 0);
        throw erreur;
      }
      return "enregistre";
    },
  };
}

let signalementsBranches: ReturnType<typeof creerSignalementsImagesLieu> | null = null;

export function brancherSignalementsImagesLieu(signalements: ReturnType<typeof creerSignalementsImagesLieu> | null): void {
  signalementsBranches = signalements;
}

export async function enregistrerSignalementImageLieu(s: SignalementImageLieuRecu): Promise<IssueSignalementImageLieu> {
  return signalementsBranches ? signalementsBranches.enregistrer(s) : "chiffrement-indisponible";
}
