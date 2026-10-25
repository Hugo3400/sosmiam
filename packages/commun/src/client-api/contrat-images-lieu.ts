import type { ImageLieu } from "../regles/images-lieu.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceImagesLieu {
  envoyer(lieuId: number, quelle: ImageLieu, octets: Blob | ArrayBuffer | Uint8Array): Promise<ReponseApi<{ adresse: string }>>;
  retirer(lieuId: number, quelle: ImageLieu): Promise<ReponseApi>;
}
