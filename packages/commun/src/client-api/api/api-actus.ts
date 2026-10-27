import type { ClientHttp } from "../client-http.ts";
import type { FiltresListeActus, ServiceActus } from "../contrat-actus.ts";

function ecrireRecherche({ rubrique, ville, curseur }: FiltresListeActus): string {
  const recherche = new URLSearchParams();
  if (rubrique) recherche.set("rubrique", rubrique);
  if (ville) recherche.set("ville", ville);
  if (curseur) recherche.set("curseur", curseur);
  const texte = recherche.toString();
  return texte ? `?${texte}` : "";
}

export function creerActusApi(client: ClientHttp): ServiceActus {
  return {
    lister: (filtres) => client.demander("GET", `/app/actus${ecrireRecherche(filtres)}`),
    villes: () => client.demander("GET", "/app/actus/villes"),
    lire: (id) => client.demander("GET", `/app/actus/${id}`),
    aimer: (id, aime) => client.demander(aime ? "POST" : "DELETE", `/app/actus/${id}/jaime`),
    envoyerPhoto: (octets) => client.envoyerOctets("/app/actus/photos", octets, "image/jpeg"),
    envoyer: (corps) => client.demander("POST", "/app/actus", { corps }),
    mesArticles: () => client.demander("GET", "/app/actus/miens"),
    lireBrouillon: (id) => client.demander("GET", `/app/actus/miens/${id}`),
    retoucher: (id, corps) => client.demander("PUT", `/app/actus/miens/${id}`, { corps }),
    articlesDuLieu: (lieuId) => client.demander("GET", `/pro/comptoir/lieux/${lieuId}/actus`),
    repondre: (lieuId, articleId, texte) => client.demander("POST", `/pro/comptoir/lieux/${lieuId}/actus/${articleId}/reponse`, { corps: { texte } }),
  };
}
