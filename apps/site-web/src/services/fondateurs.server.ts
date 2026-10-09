// Fondateurs par ville : recherche de commune et places de sa zone (ville ou département), appels publics à l'API, côté
// serveur uniquement (le navigateur passe par la route du site /communes, jamais directement par l'API). L'IP du visiteur
// (X-IP-Visiteur) ne sert qu'aux limites. Contrat : apps/api/src/routes/fondateurs.ts.
import { appelerApiComptes } from "~/services/comptes.server";
import { simplifierRecherche } from "~/fonctions/texte/simplifier-recherche";
import type { CommuneFondateurs, ResultatRecherche, ZoneFondateurs } from "~/types/compte";

/** Communes dont le nom ou le code postal correspond à la recherche (8 au plus par défaut ; vide : liste vide). */
export function chercherCommunes(recherche: string, ip: string | null, limite = 8) {
  const parametres = new URLSearchParams({ recherche: recherche.slice(0, 80), limite: String(limite) });
  return appelerApiComptes<{ communes: CommuneFondateurs[] }>(`/communes?${parametres}`, { ip });
}

/** La commune (code INSEE) et la zone de fondateurs dont elle dépend, avec ses places ; « commune-inconnue » sinon. */
export function lireZoneDeCommune(code: string, ip: string | null) {
  return appelerApiComptes<{ commune: CommuneFondateurs; zone: ZoneFondateurs }>(`/fondateurs/zone?commune=${encodeURIComponent(code)}`, { ip });
}

/**
 * La zone de la ville écrite dans le compte (texte libre, « Lyon ») : seulement si une commune porte exactement ce nom
 * (la plus peuplée en cas d'homonymes). null sinon, ou si l'API ne répond pas : la page dit alors les places de la France.
 */
export async function trouverZoneDeVille(ville: string, ip: string | null): Promise<{ commune: CommuneFondateurs; zone: ZoneFondateurs } | null> {
  const cherche = simplifierRecherche(ville);
  if (!cherche) return null;
  const reponse = await chercherCommunes(ville, ip, 8);
  if (!reponse.ok) return null;
  const memeNom = reponse.communes.filter((commune) => simplifierRecherche(commune.nom) === cherche);
  const commune = memeNom.sort((a, b) => b.population - a.population)[0];
  if (!commune) return null;
  const zone = await lireZoneDeCommune(commune.code, ip);
  return zone.ok ? { commune: zone.commune, zone: zone.zone } : null;
}

const MESSAGE_PANNE = "Le compteur des places fait une pause : réessaie dans un instant.";

/**
 * Lit la recherche d'une adresse (formulaire GET, marche sans JavaScript) : `code` (une commune choisie dans une liste ou
 * dans les suggestions), sinon `texte` (nom ou code postal). Une seule commune correspond (ou une seule porte exactement ce
 * nom, ou ce code postal) : sa zone ; plusieurs : la liste où choisir.
 */
export async function resoudreRecherche(texte: string | null, code: string | null, ip: string | null): Promise<ResultatRecherche> {
  if (code) {
    const reponse = await lireZoneDeCommune(code, ip);
    if (reponse.ok) return { etat: "zone", commune: reponse.commune, zone: reponse.zone };
    return { etat: "message", message: reponse.erreur === "commune-inconnue" ? "On ne trouve pas cette commune : cherche-la par son nom." : MESSAGE_PANNE };
  }
  const recherche = (texte ?? "").replace(/\s+/g, " ").trim();
  if (!recherche) return { etat: "vide" };
  if (recherche.length < 2) return { etat: "message", message: "Écris au moins 2 lettres du nom de ta commune." };
  const reponse = await chercherCommunes(recherche, ip, 8);
  if (!reponse.ok) return { etat: "message", message: MESSAGE_PANNE };
  const { communes } = reponse;
  if (communes.length === 0) return { etat: "message", message: `On ne trouve pas « ${recherche.slice(0, 80)} » : vérifie l'orthographe, ou essaie avec ton code postal.` };
  const cherche = simplifierRecherche(recherche);
  const exactes = communes.filter((commune) => simplifierRecherche(commune.nom) === cherche || commune.codePostal === recherche);
  const seule = communes.length === 1 ? communes[0] : exactes.length === 1 ? exactes[0] : null;
  if (!seule) return { etat: "choix", communes };
  const zone = await lireZoneDeCommune(seule.code, ip);
  return zone.ok ? { etat: "zone", commune: { ...zone.commune, codePostal: seule.codePostal }, zone: zone.zone } : { etat: "message", message: MESSAGE_PANNE };
}
