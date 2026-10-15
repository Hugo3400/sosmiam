import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { AvisPublic, NoteAvis } from "@sos-miam/commun/types/avis";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

export type PhotoAvis = { uri: string; largeur: number; hauteur: number };

export type SaisieAvis = { note: NoteAvis | null; texte: string; photo: PhotoAvis | null };

export type RefusEnvoiAvis =
  | { ou: "ecran"; erreur: ErreurService; details?: DetailsErreur }
  | { ou: "texte" }
  | { ou: "photo"; erreur: ErreurService; champ?: string; details?: DetailsErreur }
  | { ou: "limite" }
  | { ou: "envoi"; erreur: ErreurService; details?: DetailsErreur };

export type AvisEnvoye = { avis: AvisPublic | null; pointsGagnes: number };

export type EtapeEnvoiAvis = "photo" | "avis";
