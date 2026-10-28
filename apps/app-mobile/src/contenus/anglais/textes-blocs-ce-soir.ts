import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MESSAGE_MOMENT, TEXTES_SOS_DU_SOIR } from "~/contenus/textes-blocs-ce-soir";

const direHeure = (heure: string) => (heure === "00:00" ? "midnight" : heure === "12:00" ? "midday" : heure);
const seats = (n: number) => `${n} seat${n === 1 ? "" : "s"}`;

export const TEXTES_SOS_DU_SOIR_ANGLAIS: Traduction<typeof TEXTES_SOS_DU_SOIR> = {
  erreurPlaces: (min: number, max: number) => `Between ${min} and ${max} seats.`,
  erreurOffre: (max: number) => `${max} characters max, and no swearing.`,
  erreurFin: "Pick an end time before tonight's closing.",
  enCoursTitre: "🛟 SOS in progress",
  enCours: (places: number, heure: string, offre: string | null) => `${seats(places)} to fill until ${direHeure(heure)}${offre ? ` · ${offre}` : ""}.`,
  lance: (heure: string, par: string | null) => `Sent out at ${direHeure(heure)}${par ? ` by ${par}` : ""}. Local foodies can see it in the app.`,
  arreter: "End the SOS",
  arreterTitre: "End the SOS?",
  arreterDetail: "It disappears from the app straight away, and it can't go out again until tomorrow.",
  garder: "Keep it",
  finiTitre: (etat: string) => `🌙 Tonight's SOS ${etat}`,
  arreteA: (heure: string) => `was ended at ${direHeure(heure)}`,
  finiA: (heure: string) => `ran until ${direHeure(heure)}`,
  dejaLance: "has already gone out",
  finiDetail: "One SOS a day: the next one can go out tomorrow. The message of the moment is still all yours.",
  intro: "Empty tables tonight? Send out an SOS: local foodies see it straight away, along with your offer if you make one.",
  places: "Seats to fill",
  unite: (n: number) => seats(n),
  offre: "A little offer?",
  facultatif: "optional",
  offreExemple: "A free tiramisu",
  jusquaQuand: "Until when?",
  lancer: "Send the SOS",
  lancerTitre: "Shall we send the SOS?",
  lancerDetail: (places: number, fin: string) =>
    `${seats(places)}, ${fin.charAt(0).toLowerCase()}${fin.slice(1)}. Only one SOS a day: even if you end it, it can't go out again until tomorrow.`,
  confirmer: "Let's go",
  rester: "Not yet",
  aLaFermeture: (heure: string) => `At closing (${direHeure(heure)})`,
  jusqua: (heure: string) => `Until ${direHeure(heure)}`,
  carteTitre: "Tonight",
  carteVide: "Tonight's SOS and the message of the moment",
  carteEnCours: (places: number, heure: string) => `🛟 SOS in progress: ${seats(places)} until ${direHeure(heure)}`,
  carteLancer: "Empty tables? Send out an SOS for tonight",
  carteTermine: "Tonight's SOS is over · a message of the moment?",
};

export const TEXTES_MESSAGE_MOMENT_ANGLAIS: Traduction<typeof TEXTES_MESSAGE_MOMENT> = {
  afficheJusqua: (heure: string) => `Showing on your listing until ${direHeure(heure)}.`,
  afficheParEquipe: "Put on your listing by the SOS Miam team.",
  effacer: "Delete message",
  intro: "A happy hour, today's special, an impromptu gig? A quick note on your listing that clears itself.",
  remplacerPar: "Replace it with",
  tonMessage: "Your message",
  exemple: "Happy hour until 20:00",
  erreurTexte: (max: number) => `1 to ${max} characters, and no swearing.`,
  combienDeTemps: "How long?",
  erreurDuree: "24 hours max, and not in the past.",
  remplacer: "Replace message",
  afficher: "Show message",
  jusquaFermeture: (heure: string) => `Until closing (${direHeure(heure)})`,
  pendant1h: "For 1 hour",
  pendant3h: "For 3 hours",
  pendant24h: "For 24 hours",
};
