import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECHEC_MISSION_ANGLAIS, TEXTES_MISSION_AMBASSADEUR_ANGLAIS } from "~/contenus/anglais/textes-espace-ambassadeur-mission";

export const TEXTES_MISSION_AMBASSADEUR = {
  presence: { position: "On regarde où tu es…", envoi: "On prévient l'équipe…" },
  presenceNotee: "📍 C'est noté, tu es bien sur place. À toi le compte rendu !",
  chargement: "Mission",
  introuvable: "Mission introuvable",
  introuvableDetail: "Elle a peut-être été annulée par l'équipe.",
  retour: "Retour",
  surPlace: (jour: string | null, heure: string) => `✓ Sur place${jour === null ? "" : ` le ${jour.toLowerCase()}`} à ${heure}`,
  ouvrirReglages: "Ouvrir les réglages",
  reessayer: "Réessayer",
  accomplie: "🎉 Mission accomplie ! Merci, l'équipe lit ton compte rendu.",
  sousTitre: (emoji: string, nom: string, echeance: string | null) => `${emoji} ${nom}${echeance === null ? "" : ` · avant le ${echeance.toLowerCase()}`}`,
  unInstant: "Un instant…",
  fini: "J'ai fini la mission",
  surPlaceBouton: "📍 Je suis sur place",
  surPlaceBoutonLu: "Je suis sur place",
  indiceSurPlace: (chezLieu: string) => `On vérifie que tu es bien ${chezLieu}, puis l'équipe voit l'heure de ton passage`,
  positionNonGardee: "Ta position sert juste à vérifier, elle n'est pas gardée : l'équipe ne voit que l'heure.",
  voirFiche: "Voir la fiche du lieu",
  compteRendu: "Ton compte rendu",
  placeholder: "Ce que tu as vu sur place, en quelques mots",
  aide: (minimum: number) => `${minimum} caractères au moins · relu par l'équipe seulement`,
  annulee: "Mission annulée par l'équipe",
  faiteLe: (jour: string) => `✅ Faite le ${jour.toLowerCase()}`,
  verifTitre: "Petite vérif' de position",
  surPlaceSeul: "sur place",
  verifDetail: (ou: string, rayon: number) =>
    `On vérifie que tu es bien ${ou} (à ${rayon} m près), une seule fois. Ta position n'est pas gardée : l'équipe voit juste l'heure de ton passage.`,
  verifConfirmer: "OK, vérifie",
  verifRester: "Pas maintenant",
  verifIndiceRester: "Ta position n'est pas lue",
} as const;

export const TEXTES_ECHEC_MISSION: Partial<Record<ErreurService, string>> = {
  "position-refusee": "… et l'équipe ne verra pas l'heure de ton passage. Pas de panique : ton compte rendu suffit aussi !",
  "position-simulee": "Coupe-la pour montrer que tu es bien sur place.",
};

export const TEXTES_MISSION_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MISSION_AMBASSADEUR>> = { fr: TEXTES_MISSION_AMBASSADEUR, en: TEXTES_MISSION_AMBASSADEUR_ANGLAIS };
export const TEXTES_ECHEC_MISSION_PAR_LANGUE: ParLangue<Partial<Record<ErreurService, string>>> = { fr: TEXTES_ECHEC_MISSION, en: TEXTES_ECHEC_MISSION_ANGLAIS };
