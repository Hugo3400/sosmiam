import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { ActivitePote, ListePartagee, Pote, Recommandation, Sortie } from "@sos-miam/commun/types/potes";

// Potes d'exemple (démo, repris du prototype) : ils votent et répondent tout seuls, en attendant les vrais comptes.
// Les identifiants de lieux renvoient à lieux-exemples.ts. Inès et Jade ont moins de 18 ans : pas de bar avec elles.

/** Toutes les personnes que l'app connaît en démo : ta bande, et quelques autres qu'on peut trouver par pseudo */
export const potesExemples: Pote[] = [
  { id: "lea", pseudo: "lea.croque", prenom: "Léa", avatar: "🦊", ville: "Montpellier", mineur: false, points: 342, pointsDuMois: 64, rescoussesDuMois: 9, lieuxSauves: [0, 1, 4, 11, 13], gardes: [8, 12, 16], badges: ["premiere-rescousse", "premier-sauveteur"] },
  { id: "karim", pseudo: "karim.mtp", prenom: "Karim", avatar: "🐻", ville: "Montpellier", mineur: false, points: 315, pointsDuMois: 48, rescoussesDuMois: 7, lieuxSauves: [2, 5, 9, 13, 14], gardes: [6], badges: ["premiere-rescousse"] },
  { id: "ines", pseudo: "ines.boutonnet", prenom: "Inès", avatar: "🐙", ville: "Montpellier", mineur: true, points: 128, pointsDuMois: 30, rescoussesDuMois: 5, lieuxSauves: [1, 3, 4], gardes: [11, 15], badges: ["premiere-rescousse"] },
  { id: "tom", pseudo: "tom.portmarianne", prenom: "Tom", avatar: "🦁", ville: "Montpellier", mineur: false, points: 96, pointsDuMois: 22, rescoussesDuMois: 3, lieuxSauves: [6, 7], gardes: [12, 16], badges: ["premiere-rescousse"] },
  { id: "sofia", pseudo: "sofia.antigone", prenom: "Sofia", avatar: "🐝", ville: "Montpellier", mineur: false, points: 210, pointsDuMois: 40, rescoussesDuMois: 6, lieuxSauves: [0, 8, 12], gardes: [4, 13], badges: ["premiere-rescousse", "premier-sauveteur"] },
  { id: "max", pseudo: "max.sete", prenom: "Max", avatar: "🐢", ville: "Sète", mineur: false, points: 54, pointsDuMois: 12, rescoussesDuMois: 2, lieuxSauves: [9, 13], gardes: [11, 14], badges: [] },
  { id: "camille", pseudo: "camille.ecusson", prenom: "Camille", avatar: "🦉", ville: "Montpellier", mineur: false, points: 418, pointsDuMois: 71, rescoussesDuMois: 11, lieuxSauves: [0, 2, 3, 5, 7], gardes: [1], badges: ["premiere-rescousse", "premier-sauveteur"] },
  { id: "jade", pseudo: "jade.mtp", prenom: "Jade", avatar: "🦩", ville: "Montpellier", mineur: true, points: 121, pointsDuMois: 18, rescoussesDuMois: 3, lieuxSauves: [1, 4], gardes: [3], badges: ["premiere-rescousse"] },
];

/** Les exemples ci-dessous en sont à cette version (2 : sorties passées, lieux reçus, nouvelles et listes en plus ; 3 : quelques
 * exemples corrigés, 9 octobre 2026) ; une démo enregistrée avec une version plus ancienne les reçoit une fois (ajouterNouveauxExemples) */
export const VERSION_EXEMPLES = 3;

/** Exemples corrigés en version 3 : une démo en version 2 les remplace (s'ils y sont encore), sans rien rajouter de retiré */
export const EXEMPLES_CORRIGES_V3 = ["passee-pizza", "passee-gouter", "passee-sete", "passee-escape", "passee-brunch", "passee-anniv", "gouters", "a9", "r4"];

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

/**
 * Une sortie déjà vécue, il y a `jours` jours à `heure` heures : vote fini, lieu retenu, quelques votes et un message. Les
 * `invites` sont les potes en plus de l'organisateur (et de toi). Pas de jour de la semaine dans les titres : la date bouge
 * avec le jour où la démo commence.
 */
const sortiePassee = (
  maintenant: Date,
  s: { id: string; titre: string; emoji: string; jours: number; heure: number; organisateur: string; invites: string[]; lieuChoisi: number; autre: number; mot: string },
): Sortie => ({
  id: s.id,
  titre: s.titre,
  emoji: s.emoji,
  quand: dans(maintenant, -s.jours, s.heure),
  organisateur: s.organisateur,
  participants: [ID_MOI, s.organisateur, ...s.invites],
  propositions: [
    { lieuId: s.lieuChoisi, proposePar: s.organisateur, votes: [s.organisateur, ...s.invites.slice(0, 2)] },
    { lieuId: s.autre, proposePar: s.invites[0] ?? s.organisateur, votes: [] },
  ],
  finVote: dans(maintenant, -s.jours - 1, 18),
  lieuChoisi: s.lieuChoisi,
  messages: [{ id: `${s.id}-1`, auteur: s.organisateur, texte: s.mot, date: dans(maintenant, -s.jours - 2, 12) }],
});

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
      // Déjà vécues (pour voir « Voir plus » et « Retirer de tes sorties »). Pas de bar : Inès a moins de 18 ans
      sortiePassee(maintenant, { id: "passee-pizza", titre: "Soirée pizza", emoji: "🍕", jours: 3, heure: 20, organisateur: "lea", invites: ["karim"], lieuChoisi: 0, autre: 3, mot: "On réserve pour 3 ?" }),
      sortiePassee(maintenant, { id: "passee-gouter", titre: "Goûter chez Inès", emoji: "🧁", jours: 8, heure: 16, organisateur: "ines", invites: ["tom"], lieuChoisi: 4, autre: 11, mot: "Choux à la pistache, je dis ça je dis rien" }),
      sortiePassee(maintenant, { id: "passee-sete", titre: "Virée à Sète", emoji: "⚓", jours: 13, heure: 12, organisateur: "karim", invites: ["lea", "tom"], lieuChoisi: 9, autre: 13, mot: "Train de 10 h, soyez à l'heure 😅" }),
      sortiePassee(maintenant, { id: "passee-escape", titre: "Escape game", emoji: "🔐", jours: 20, heure: 20, organisateur: "tom", invites: ["karim"], lieuChoisi: 7, autre: 8, mot: "Il nous faut un 4e !" }),
      sortiePassee(maintenant, { id: "passee-brunch", titre: "Brunch entre potes", emoji: "🥞", jours: 27, heure: 11, organisateur: "lea", invites: ["ines"], lieuChoisi: 16, autre: 1, mot: "Pancakes ou rien" }),
      sortiePassee(maintenant, { id: "passee-anniv", titre: "Anniv de Karim", emoji: "🎉", jours: 41, heure: 20, organisateur: "lea", invites: ["karim", "tom"], lieuChoisi: 3, autre: 0, mot: "Chut, c'est une surprise 🤫" }),
    ],
    listes: [
      { id: "dimanche-sete", titre: "Dimanche à Sète", emoji: "⚓", description: "Tielle, zézettes et huîtres : le combo parfait.", auteur: "max", lieux: [9, 10, 13], abonnes: [ID_MOI, "lea", "tom"] },
      { id: "anniv-ines", titre: "Idées pour l'anniv d'Inès", emoji: "🎂", description: "Chut, c'est une surprise !", auteur: ID_MOI, lieux: [7, 8, 4], abonnes: ["karim", "tom", "sofia"] },
      { id: "terrasses", titre: "Terrasses au soleil", emoji: "☀️", description: "Pour profiter de l'été indien montpelliérain.", auteur: "lea", lieux: [0, 5, 2, 17], abonnes: ["ines"] },
      { id: "fin-de-mois", titre: "Fin de mois serrée", emoji: "🪙", description: "Bien manger pour moins de 12 €.", auteur: "karim", lieux: [3, 1, 11, 9], abonnes: ["ines", "max"] },
      { id: "brunchs", titre: "Brunchs du dimanche", emoji: "🥞", description: "Pour les grasses matinées qui finissent bien.", auteur: "tom", lieux: [1, 4, 16], abonnes: [] },
      { id: "petits-prix", titre: "Petits prix, gros plaisir", emoji: "💸", description: "La preuve qu'on peut se régaler sans se ruiner.", auteur: "lea", lieux: [3, 9, 13], abonnes: ["karim"] },
      { id: "pluie", titre: "Quand il pleut", emoji: "🌧️", description: "Des sorties au sec, pour les jours gris.", auteur: "karim", lieux: [6, 7, 8], abonnes: [] },
      { id: "apres-sport", titre: "Après le sport", emoji: "🏃", description: "On l'a bien mérité.", auteur: "tom", lieux: [0, 12, 16], abonnes: ["lea"] },
      { id: "gouters", titre: "Goûters de folie", emoji: "🧁", description: "Choux, cookies et compagnie.", auteur: "ines", lieux: [4, 1, 10, 11, 15], abonnes: ["tom"] },
    ],
    activites: [
      { id: "a1", pote: "lea", type: "rescousse", lieuId: 13, date: ilYa(maintenant, 2) },
      { id: "a2", pote: "karim", type: "garde", lieuId: 6, date: ilYa(maintenant, 5) },
      { id: "a3", pote: "ines", type: "badge", detail: "Première rescousse", date: ilYa(maintenant, 26) },
      { id: "a4", pote: "lea", type: "liste", detail: "Terrasses au soleil", date: ilYa(maintenant, 30) },
      { id: "a5", pote: "tom", type: "rescousse", lieuId: 7, date: ilYa(maintenant, 50) },
      { id: "a6", pote: "karim", type: "rescousse", lieuId: 13, date: ilYa(maintenant, 70) },
      { id: "a7", pote: "tom", type: "garde", lieuId: 12, date: ilYa(maintenant, 90) },
      { id: "a8", pote: "lea", type: "badge", detail: "Premier sauveteur", date: ilYa(maintenant, 110) },
      { id: "a9", pote: "karim", type: "palier", detail: "Ambassadeur de quartier", date: ilYa(maintenant, 180) },
      { id: "a10", pote: "tom", type: "sortie", detail: "Escape game", date: ilYa(maintenant, 500) },
      { id: "a11", pote: "lea", type: "garde", lieuId: 16, date: ilYa(maintenant, 260) },
      { id: "a12", pote: "tom", type: "liste", detail: "Brunchs du dimanche", date: ilYa(maintenant, 300) },
      { id: "a13", pote: "karim", type: "rescousse", lieuId: 9, date: ilYa(maintenant, 380) },
      { id: "a14", pote: "lea", type: "rescousse", lieuId: 0, date: ilYa(maintenant, 460) },
    ],
    recommandations: [
      { id: "r1", de: "lea", a: ID_MOI, lieuId: 13, mot: "Les huîtres de Bouzigues, il FAUT que tu goûtes 🦪", date: ilYa(maintenant, 3), vue: false },
      { id: "r2", de: "karim", a: ID_MOI, lieuId: 7, mot: "Escape game samedi ? On est 3, il en faut 4", date: ilYa(maintenant, 28), vue: true },
      { id: "r3", de: "tom", a: ID_MOI, lieuId: 6, mot: "Le kayak du dimanche, on y retourne ?", date: ilYa(maintenant, 30), vue: true },
      { id: "r4", de: "ines", a: ID_MOI, lieuId: 11, mot: "Le petit pâté de Pézenas, Molière validait déjà 😍", date: ilYa(maintenant, 50), vue: false },
      { id: "r5", de: "lea", a: ID_MOI, lieuId: 0, mot: "Nonna Lia a besoin de monde ce soir", date: ilYa(maintenant, 72), vue: true },
      { id: "r6", de: "karim", a: ID_MOI, lieuId: 3, date: ilYa(maintenant, 96), vue: true },
      { id: "r7", de: "tom", a: ID_MOI, lieuId: 16, mot: "Testé hier, validé 👌", date: ilYa(maintenant, 130), vue: false },
      { id: "r8", de: "ines", a: ID_MOI, lieuId: 4, mot: "Pour ton anniv 🎂", date: ilYa(maintenant, 170), vue: true },
      { id: "r9", de: "lea", a: ID_MOI, lieuId: 9, mot: "À Sète, la tielle de la mort", date: ilYa(maintenant, 220), vue: true },
    ],
  };
}
