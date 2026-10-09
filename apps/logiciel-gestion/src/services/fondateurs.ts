// Fondateurs par ville (docs/decisions.md) : candidatures, zones (villes et départements) et leurs places, et les deux
// numéros de carte donnés à l'acceptation (« Fondateur n° 3 de Lyon · n° 147 en France »), jamais redonnés.
import { appeler, parametres } from "./client-gestion.ts";
import type { Palier, StatutAmbassadeur } from "./ambassadeurs.ts";

export type StatutCandidature = "en-attente" | "acceptee" | "souvenir" | "refusee";
export type ZoneCourte = { code: string; type: "ville" | "departement"; nom: string; nomAvecDe: string; places: number };
export type ZoneFondateurs = ZoneCourte & {
  codeDepartement: string;
  population: number;
  prochainNumero: number;
  prises: number;
  enAttente: number;
  souvenirs: number;
};
export type ZonesFondateurs = {
  zones: ZoneFondateurs[];
  totaux: { places: number; prises: number; enAttente: number; sansZone: number; prochainNumeroNational: number };
};
export type Candidature = {
  id: number;
  compteId: number;
  pepites: string;
  envies: string;
  reseaux: string | null;
  motivation: string;
  partantRencontre: boolean;
  connuPar: string | null;
  statut: StatutCandidature;
  communeCode: string | null;
  zoneCode: string | null;
  numeroLocal: number | null;
  numeroNational: number | null;
  creeLe: string;
  reponduLe: string | null;
  zone: ZoneCourte | null;
  compte?: {
    id: number; prenom: string; email: string; emailVerifieLe: string | null; points: number; palier: Palier;
    ambassadeur: { ville: string; quartier: string | null; statut: StatutAmbassadeur } | null;
  };
};
export type CommuneAvecZone = { code: string; nom: string; nomDepartement: string; codeDepartement: string; population: number; codePostal: string | null; zone: ZoneCourte | null };

export const listerCandidatures = (statut: string) => appeler<Candidature[]>("GET", `/candidatures${parametres({ statut })}`);
export const accepterCandidature = (id: number) =>
  appeler<{ ok: true; numeroLocal: number; numeroNational: number; zone: ZoneCourte }>("POST", `/candidatures/${id}/accepter`, { corps: {} });
export const refuserCandidature = (id: number) => appeler<{ ok: true }>("POST", `/candidatures/${id}/refuser`, { corps: {} });
export const choisirCommuneCandidature = (id: number, commune: string) =>
  appeler<{ ok: true; commune: string; zone: ZoneCourte }>("POST", `/candidatures/${id}/commune`, { corps: { commune } });
/** Déménagement : la personne garde son titre et ses numéros (« souvenir »), sa place se rouvre dans sa zone */
export const libererPlaceFondateur = (id: number) => appeler<{ ok: true; encoreFondateurDeVille: boolean }>("POST", `/candidatures/${id}/liberer`, { corps: {} });
export const listerZonesFondateurs = () => appeler<ZonesFondateurs>("GET", "/fondateurs/zones");
export const chercherCommunes = (texte: string) => appeler<CommuneAvecZone[]>("GET", `/fondateurs/communes${parametres({ texte })}`);
