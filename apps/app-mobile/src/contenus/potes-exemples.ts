import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { ActivitePote, ListePartagee, Pote, Recommandation, Sortie } from "@sos-miam/commun/types/potes";

// Potes d'exemple (démo, repris du prototype) : ils votent et répondent tout seuls, en attendant les vrais comptes.
// Les identifiants de lieux renvoient à lieux-exemples.ts. Inès et Jade ont moins de 18 ans : pas de bar avec elles.

/** Toutes les personnes que l'app connaît en démo : ta bande, et quelques autres qu'on peut trouver par pseudo */
export const potesExemples: Pote[] = [
  { id: "lea", pseudo: "lea.croque", prenom: "Léa", avatar: "🦊", ville: "Montpellier", mineur: false, points: 342, pointsDuMois: 64, rescoussesDuMois: 9, lieuxSauves: [0, 1, 4, 11, 13], gardes: [8, 12], badges: ["premiere-rescousse", "premier-sauveteur"] },
  { id: "karim", pseudo: "karim.mtp", prenom: "Karim", avatar: "🐻", ville: "Montpellier", mineur: false, points: 315, pointsDuMois: 48, rescoussesDuMois: 7, lieuxSauves: [2, 5, 13, 14], gardes: [6, 9], badges: ["premiere-rescousse"] },
  { id: "ines", pseudo: "ines.boutonnet", prenom: "Inès", avatar: "🐙", ville: "Montpellier", mineur: true, points: 128, pointsDuMois: 30, rescoussesDuMois: 5, lieuxSauves: [1, 3, 4], gardes: [11, 15], badges: ["premiere-rescousse"] },
  { id: "tom", pseudo: "tom.portmarianne", prenom: "Tom", avatar: "🦁", ville: "Montpellier", mineur: false, points: 96, pointsDuMois: 22, rescoussesDuMois: 3, lieuxSauves: [6, 7], gardes: [12, 16], badges: ["premiere-rescousse"] },
  { id: "sofia", pseudo: "sofia.antigone", prenom: "Sofia", avatar: "🐝", ville: "Montpellier", mineur: false, points: 210, pointsDuMois: 40, rescoussesDuMois: 6, lieuxSauves: [0, 8, 12], gardes: [4, 13], badges: ["premiere-rescousse", "premier-sauveteur"] },
  { id: "max", pseudo: "max.sete", prenom: "Max", avatar: "🐢", ville: "Sète", mineur: false, points: 54, pointsDuMois: 12, rescoussesDuMois: 2, lieuxSauves: [9, 10], gardes: [13, 14], badges: [] },
  { id: "camille", pseudo: "camille.ecusson", prenom: "Camille", avatar: "🦉", ville: "Montpellier", mineur: false, points: 418, pointsDuMois: 71, rescoussesDuMois: 11, lieuxSauves: [0, 2, 3, 5, 7], gardes: [1], badges: ["premiere-rescousse", "premier-sauveteur"] },
  { id: "jade", pseudo: "jade.mtp", prenom: "Jade", avatar: "🦩", ville: "Montpellier", mineur: true, points: 121, pointsDuMois: 18, rescoussesDuMois: 3, lieuxSauves: [1, 4], gardes: [3], badges: ["premiere-rescousse"] },
];

/** Ta bande au départ de la démo */
export const bandeExemple = ["lea", "karim", "ines", "tom"];

/** Ce que les potes d'exemple répondent dans une discussion de sortie */
export const reponsesExemples = [
  "Grave chaud ! 🙌",
  "Je regarde mon agenda et je te dis 👀",
  "Je vote pour celui qui a besoin de monde ce soir 🛟",
  "J'ai faim rien qu'à lire ça",
  "OK pour moi, on se retrouve devant ?",
  "Je ramène ma bonne humeur, c'est déjà ça 😄",
  "Validé ! Je mets un réveil pour pas oublier",
];

const dans = (maintenant: Date, jours: number, heure: number, minute = 0) => {
  const date = new Date(maintenant);
  date.setDate(date.getDate() + jours);
  date.setHours(heure, minute, 0, 0);
  return date.toISOString();
};
const ilYa = (maintenant: Date, heures: number) => new Date(maintenant.getTime() - heures * 3_600_000).toISOString();

/** Sorties, listes, activité et recommandations de la démo, datées à partir d'aujourd'hui (pour qu'elles restent à venir). */
export function creerDonneesExemplePotes(maintenant: Date): {
  sorties: Sortie[];
  listes: ListePartagee[];
  activites: ActivitePote[];
  recommandations: Recommandation[];
} {
  return {
    sorties: [
      {
        id: "vendredi",
        titre: "Resto de vendredi soir",
        emoji: "🍽️",
        quand: dans(maintenant, 2, 20, 30),
        organisateur: "lea",
        participants: [ID_MOI, "lea", "karim", "ines"],
        propositions: [
          { lieuId: 0, proposePar: "lea", votes: ["lea", "karim"] },
          { lieuId: 3, proposePar: "ines", votes: ["ines"] },
          { lieuId: 4, proposePar: "karim", votes: [] },
        ],
        finVote: dans(maintenant, 1, 18),
        lieuChoisi: null,
        messages: [
          { id: "v1", auteur: "lea", texte: "Qui est chaud pour vendredi ? Nonna Lia a besoin de monde 🍝", date: ilYa(maintenant, 5) },
          { id: "v2", auteur: "karim", texte: "Moi ! Mais pas trop tard, je bosse samedi", date: ilYa(maintenant, 4) },
          { id: "v3", auteur: "ines", texte: "Les baos de Mei sinon, c'est trop bon", date: ilYa(maintenant, 3) },
        ],
      },
      {
        id: "dimanche",
        titre: "Sortie de dimanche",
        emoji: "🛶",
        quand: dans(maintenant, 4, 10),
        organisateur: "tom",
        participants: [ID_MOI, "tom", "sofia"],
        propositions: [
          { lieuId: 6, proposePar: "tom", votes: ["tom"] },
          { lieuId: 12, proposePar: "sofia", votes: ["sofia"] },
          { lieuId: 8, proposePar: "tom", votes: [] },
        ],
        finVote: dans(maintenant, 3, 12),
        lieuChoisi: null,
        messages: [{ id: "d1", auteur: "tom", texte: "Kayak ou paddle ? Les deux me vont 🌊", date: ilYa(maintenant, 20) }],
      },
    ],
    listes: [
      { id: "dimanche-sete", titre: "Dimanche à Sète", emoji: "⚓", description: "Tielle, zézettes et huîtres : le combo parfait.", auteur: "max", lieux: [9, 10, 13], abonnes: [ID_MOI, "lea", "tom"] },
      { id: "anniv-ines", titre: "Idées pour l'anniv d'Inès", emoji: "🎂", description: "Chut, c'est une surprise !", auteur: ID_MOI, lieux: [7, 8, 4], abonnes: ["karim", "tom", "sofia"] },
      { id: "terrasses", titre: "Terrasses au soleil", emoji: "☀️", description: "Pour profiter de l'été indien montpelliérain.", auteur: "lea", lieux: [0, 5, 2, 17], abonnes: ["ines"] },
      { id: "fin-de-mois", titre: "Fin de mois serrée", emoji: "🪙", description: "Bien manger pour moins de 12 €.", auteur: "karim", lieux: [3, 1, 11, 9], abonnes: ["ines", "max"] },
    ],
    activites: [
      { id: "a1", pote: "lea", type: "rescousse", lieuId: 13, date: ilYa(maintenant, 2) },
      { id: "a2", pote: "karim", type: "garde", lieuId: 6, date: ilYa(maintenant, 5) },
      { id: "a3", pote: "ines", type: "badge", detail: "Première rescousse", date: ilYa(maintenant, 26) },
      { id: "a4", pote: "lea", type: "liste", detail: "Terrasses au soleil", date: ilYa(maintenant, 30) },
      { id: "a5", pote: "tom", type: "rescousse", lieuId: 7, date: ilYa(maintenant, 50) },
    ],
    recommandations: [
      { id: "r1", de: "lea", a: ID_MOI, lieuId: 13, mot: "Les huîtres de Bouzigues, il FAUT que tu goûtes 🦪", date: ilYa(maintenant, 3), vue: false },
      { id: "r2", de: "karim", a: ID_MOI, lieuId: 7, mot: "Escape game samedi ? On est 3, il en faut 4", date: ilYa(maintenant, 28), vue: true },
    ],
  };
}
