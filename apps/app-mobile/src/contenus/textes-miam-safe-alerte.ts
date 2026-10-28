import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MIAM_SAFE_ALERTE_ANGLAIS } from "~/contenus/anglais/textes-miam-safe-alerte";

export const TEXTES_MIAM_SAFE_ALERTE = {
  souciEquipe: "Le souci vient de l'équipe ? Appelle plutôt un proche ou les secours.",
  pasSeul: "Ne reste pas seul·e : appelle les secours, ou préviens un pote.",
  envoiVersLieu: (heure: string) => `Elle est partie à ${heure} vers l'équipe du lieu, avec ton prénom et où tu es. Rien ne sonne de ton côté.`,
  envoiSurTelephones: (heure: string, telephones: number) =>
    `Elle est partie à ${heure} sur ${telephones} téléphone${telephones > 1 ? "s" : ""} de l'équipe, avec ton prénom et où tu es. Rien ne sonne de ton côté.`,
  renvoyer: "Renvoyer une alerte",
  renvoyerIndice: "Une nouvelle alerte silencieuse à l'équipe du lieu",
  relecture: "On regarde si l'équipe a répondu…",
  pasEncoreRepondu: "L'équipe n'a pas encore répondu.",
  remontee: (heure: string) => `Ton alerte de ${heure} est remontée à l'équipe SOS Miam.`,
  prevenirPote: "Prévenir un pote",
  rienRecuTitre: "⚠️ L'équipe n'a rien reçu",
  rienRecuTexte: "Aucun téléphone de l'équipe n'a reçu l'alerte. Va voir quelqu'un de l'équipe si tu peux, ou préviens un pote.",
  enRoute: (heure: string) => `Elle a répondu « On arrive » à ${heure}. Reste où tu es si tu peux : quelqu'un vient te voir discrètement.`,
  equipeArrive: "L'équipe arrive",
  alerteEnvoyee: "Alerte envoyée",
  relance: (minutes: number) => `Sans réponse dans ${minutes} minutes, on te propose d'appeler les secours ou de prévenir un pote.`,
  nouvelleAlerte: "Nouvelle alerte",
  nouvelleAlerteIndice: "Si tu as encore besoin de l'équipe",
  pasPartieTitre: "⚠️ L'alerte n'est pas partie",
  donnees: "L'alerte donne à l'équipe ton prénom et où tu es, jamais ton nom ni ta photo.",
  detailLibelle: "Un détail pour te trouver",
  facultatif: "facultatif",
  detailPlaceholder: "Table 12, pull vert…",
  detailAide: "",
  envoi: "Envoi…",
  envoyer: "Envoyer en silence",
  indiceEndroit: "Dis d'abord où tu es",
  indiceEnvoyer: "L'alerte part sur les téléphones de l'équipe du lieu",
};

export const TEXTES_MIAM_SAFE_ALERTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MIAM_SAFE_ALERTE>> = { fr: TEXTES_MIAM_SAFE_ALERTE, en: TEXTES_MIAM_SAFE_ALERTE_ANGLAIS };
