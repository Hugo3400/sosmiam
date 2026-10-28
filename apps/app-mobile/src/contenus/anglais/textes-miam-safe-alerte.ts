import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MIAM_SAFE_ALERTE } from "~/contenus/textes-miam-safe-alerte";

export const TEXTES_MIAM_SAFE_ALERTE_ANGLAIS: Traduction<typeof TEXTES_MIAM_SAFE_ALERTE> = {
  souciEquipe: "Is the problem with the staff? Call someone you trust or the emergency services instead.",
  pasSeul: "Don't stay on your own: call the emergency services or alert a friend.",
  envoiVersLieu: (heure: string) => `It went to the staff at ${heure}, with your first name and where you are. Nothing will ring on your phone.`,
  envoiSurTelephones: (heure: string, telephones: number) =>
    `It went to ${telephones} staff phone${telephones === 1 ? "" : "s"} at ${heure}, with your first name and where you are. Nothing will ring on your phone.`,
  renvoyer: "Send the alert again",
  renvoyerIndice: "A new silent alert to the staff",
  relecture: "We're checking whether the staff have replied…",
  pasEncoreRepondu: "The staff haven't replied yet.",
  remontee: (heure: string) => `Your ${heure} alert has gone to the SOS Miam team.`,
  prevenirPote: "Alert a friend",
  rienRecuTitre: "⚠️ The staff didn't get the alert",
  rienRecuTexte: "None of the staff's phones received the alert. Go and find a member of staff if you can, or alert a friend.",
  enRoute: (heure: string) => `The staff replied “On our way” at ${heure}. Stay where you are if you can – someone's coming to you quietly.`,
  equipeArrive: "The staff are on their way",
  alerteEnvoyee: "Alert sent",
  relance: (minutes: number) => `If there's no reply within ${minutes} minute${minutes === 1 ? "" : "s"}, we'll suggest calling the emergency services or alerting a friend.`,
  nouvelleAlerte: "New alert",
  nouvelleAlerteIndice: "If you still need the staff",
  pasPartieTitre: "⚠️ The alert didn't go through",
  donnees: "The alert gives the staff your first name and where you are – never your surname or your photo.",
  detailLibelle: "A detail to help find you",
  facultatif: "optional",
  detailPlaceholder: "Table 12, green jumper…",
  detailAide: "The staff may not read English – a table number helps most.",
  envoi: "Sending…",
  envoyer: "Send silently",
  indiceEndroit: "Say where you are first",
  indiceEnvoyer: "The alert goes to the staff's phones",
};
