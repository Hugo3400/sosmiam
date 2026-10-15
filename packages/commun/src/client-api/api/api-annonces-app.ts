import type { AnnonceApp } from "../../types/annonce-app.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceAnnoncesApp } from "../contrat-annonces-app.ts";

export function creerAnnoncesAppApi(client: ClientHttp): ServiceAnnoncesApp {
  return {
    lister: (ville) => client.demander<{ annonces: AnnonceApp[] }>("GET", ville ? `/app/annonces?ville=${encodeURIComponent(ville)}` : "/app/annonces"),
  };
}
