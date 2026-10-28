import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MESSAGE_MOMENT_ANGLAIS, TEXTES_SOS_DU_SOIR_ANGLAIS } from "~/contenus/anglais/textes-blocs-ce-soir";

export const TEXTES_SOS_DU_SOIR = {
  erreurPlaces: (min: number, max: number) => `Entre ${min} et ${max} places.`,
  erreurOffre: (max: number) => `${max} caractères au plus, et sans gros mot.`,
  erreurFin: "Choisis une fin, avant la fermeture de ce soir.",
  enCoursTitre: "🛟 SOS en cours",
  enCours: (places: number, heure: string, offre: string | null) => `${places} place${places > 1 ? "s" : ""} à remplir jusqu'à ${heure}${offre ? ` · ${offre}` : ""}.`,
  lance: (heure: string, par: string | null) => `Lancé à ${heure}${par ? ` par ${par}` : ""}. Les gourmands du coin le voient dans l'app.`,
  arreter: "Arrêter le SOS",
  arreterTitre: "Arrêter le SOS ?",
  arreterDetail: "Il disparaît tout de suite de l'app, et il ne se relance pas avant demain.",
  garder: "Je le garde",
  finiTitre: (etat: string) => `🌙 Le SOS de ce soir est ${etat}`,
  arreteA: (heure: string) => `arrêté à ${heure}`,
  finiA: (heure: string) => `fini à ${heure}`,
  dejaLance: "déjà lancé",
  finiDetail: "Un SOS par jour : le prochain se lance demain. Le message du moment, lui, reste à ta main.",
  intro: "Des tables vides ce soir ? Lance un SOS : les gourmands du coin le voient tout de suite, avec ton offre si tu en fais une.",
  places: "Places à remplir",
  unite: (n: number) => `${n} place${n > 1 ? "s" : ""}`,
  offre: "Une petite offre ?",
  facultatif: "facultatif",
  offreExemple: "Un tiramisu offert",
  jusquaQuand: "Jusqu'à quand ?",
  lancer: "Lancer le SOS",
  lancerTitre: "On lance le SOS ?",
  lancerDetail: (places: number, fin: string) =>
    `${places} place${places > 1 ? "s" : ""}, ${fin.toLowerCase()}. Un seul SOS par jour : même arrêté, il ne se relance pas avant demain.`,
  confirmer: "C'est parti",
  rester: "Pas encore",
  aLaFermeture: (heure: string) => `À la fermeture (${heure})`,
  jusqua: (heure: string) => `Jusqu'à ${heure}`,
  carteTitre: "Ce soir",
  carteVide: "Le SOS du soir et le message du moment",
  carteEnCours: (places: number, heure: string) => `🛟 SOS en cours : ${places} place${places > 1 ? "s" : ""} jusqu'à ${heure}`,
  carteLancer: "Des tables vides ? Lance un SOS du soir",
  carteTermine: "SOS de ce soir terminé · un message du moment ?",
};

export const TEXTES_SOS_DU_SOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SOS_DU_SOIR>> = { fr: TEXTES_SOS_DU_SOIR, en: TEXTES_SOS_DU_SOIR_ANGLAIS };

export const TEXTES_MESSAGE_MOMENT = {
  afficheJusqua: (heure: string) => `Affiché sur ta fiche jusqu'à ${heure}.`,
  afficheParEquipe: "Affiché sur ta fiche par l'équipe SOS Miam.",
  effacer: "Effacer le message",
  intro: "Une happy hour, le plat du jour, un concert improvisé ? Un petit mot sur ta fiche, qui s'efface tout seul.",
  remplacerPar: "Le remplacer par",
  tonMessage: "Ton message",
  exemple: "Happy hour jusqu'à 20h",
  erreurTexte: (max: number) => `De 1 à ${max} caractères, et sans gros mot.`,
  combienDeTemps: "Combien de temps ?",
  erreurDuree: "24 h au plus, et pas dans le passé.",
  remplacer: "Remplacer le message",
  afficher: "Afficher le message",
  jusquaFermeture: (heure: string) => `Jusqu'à la fermeture (${heure})`,
  pendant1h: "Pendant 1 h",
  pendant3h: "Pendant 3 h",
  pendant24h: "Pendant 24 h",
};

export const TEXTES_MESSAGE_MOMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MESSAGE_MOMENT>> = { fr: TEXTES_MESSAGE_MOMENT, en: TEXTES_MESSAGE_MOMENT_ANGLAIS };
