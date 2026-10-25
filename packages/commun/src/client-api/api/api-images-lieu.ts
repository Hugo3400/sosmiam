import { REGLES_IMAGES_LIEU } from "../../regles/images-lieu.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceImagesLieu } from "../contrat-images-lieu.ts";

export function creerImagesLieuApi(client: ClientHttp): ServiceImagesLieu {
  const adresse = (id: number, quelle: string) => `/pro/comptoir/lieux/${id}/${quelle}`;
  return {
    envoyer: (id, quelle, octets) => client.envoyerOctets<{ adresse: string }>(adresse(id, quelle), octets, REGLES_IMAGES_LIEU[quelle].type, undefined, "PUT"),
    retirer: (id, quelle) => client.demander("DELETE", adresse(id, quelle)),
  };
}
