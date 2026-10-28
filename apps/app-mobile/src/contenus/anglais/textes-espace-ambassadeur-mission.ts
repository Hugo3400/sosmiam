import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MISSION_AMBASSADEUR } from "~/contenus/textes-espace-ambassadeur-mission";

export const TEXTES_MISSION_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_MISSION_AMBASSADEUR> = {
  presence: { position: "Checking where you are…", envoi: "Letting the team know…" },
  presenceNotee: "📍 Noted, you're there. Over to you for the report!",
  chargement: "Your mission",
  introuvable: "Mission not found",
  introuvableDetail: "The SOS Miam team may have cancelled it.",
  retour: "Back",
  surPlace: (jour: string | null, heure: string) => `✓ Checked in${jour === null ? "" : ` on ${jour}`} at ${heure}`,
  ouvrirReglages: "Open Settings",
  reessayer: "Try again",
  accomplie: "🎉 Mission accomplished! Thanks – the SOS Miam team will read your report.",
  sousTitre: (emoji: string, nom: string, echeance: string | null) => `${emoji} ${nom}${echeance === null ? "" : ` · by ${echeance}`}`,
  unInstant: "Just a sec…",
  fini: "Mission done",
  surPlaceBouton: "📍 I'm here",
  surPlaceBoutonLu: "I'm here",
  indiceSurPlace: (chezLieu: string) => `We check you're really ${chezLieu}, then the SOS Miam team sees what time you dropped by`,
  positionNonGardee: "Your location is only used to check – it isn't kept. The SOS Miam team only sees the time.",
  voirFiche: "See the place's page",
  compteRendu: "Your report",
  placeholder: "What you saw there, in a few words",
  aide: (minimum: number) => `At least ${minimum} characters · only read by the SOS Miam team`,
  annulee: "Mission cancelled by the SOS Miam team",
  faiteLe: (jour: string) => `✅ Done on ${jour}`,
  verifTitre: "Quick location check",
  surPlaceSeul: "there",
  verifDetail: (ou: string, rayon: number) =>
    `We check you're really ${ou} (to within ${rayon} m), just once. Your location isn't kept – the SOS Miam team only sees what time you dropped by.`,
  verifConfirmer: "OK, check",
  verifRester: "Not now",
  verifIndiceRester: "Your location won't be read",
};

export const TEXTES_ECHEC_MISSION_ANGLAIS: Partial<Record<ErreurService, string>> = {
  "position-refusee": "… and the SOS Miam team won't see what time you dropped by. Don't worry – your report is enough on its own!",
  "position-simulee": "Turn it off to show you're really there.",
};
