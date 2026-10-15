import type { AnnonceApp } from "../types/annonce-app.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceAnnoncesApp {
  lister(ville: string | null): Promise<ReponseApi<{ annonces: AnnonceApp[] }>>;
}
