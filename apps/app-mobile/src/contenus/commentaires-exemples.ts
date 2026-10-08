import type { Commentaire } from "@sos-miam/commun/types/commentaires";

// Commentaires d'exemple (démo), écrits par les potes d'exemple (potes-exemples.ts) et par les lieux eux-mêmes (« lieu »).
// Datés à partir d'aujourd'hui pour rester récents.

type Brouillon = Omit<Commentaire, "date" | "jaimes" | "mentions"> & { ilYaHeures: number; jaimes?: string[]; mentions?: string[] };

const brouillons: Brouillon[] = [
  { id: "c-0-1", publicationId: "lieu-0", auteur: "lea", texte: "Les cacio e pepe de Lia, c'est un câlin dans une assiette 🍝", ilYaHeures: 6, jaimes: ["karim", "ines", "sofia"] },
  { id: "c-0-2", publicationId: "lieu-0", auteur: "lieu", texte: "Merci Léa ! Ce soir on a encore 6 places, et le tiramisu vous attend 💛", ilYaHeures: 5, reponseA: "c-0-1", jaimes: ["lea"] },
  { id: "c-0-3", publicationId: "lieu-0", auteur: "karim", texte: "@lea.croque on y va vendredi ? Je réserve pour 4", ilYaHeures: 4, mentions: ["lea.croque"], jaimes: ["lea"] },
  { id: "c-0-4", publicationId: "lieu-0", auteur: "camille", texte: "Allez-y en semaine, c'est plus calme et Lia a le temps de papoter", ilYaHeures: 26, jaimes: ["tom"] },
  { id: "c-1-1", publicationId: "lieu-1", auteur: "ines", texte: "Les grisettes à la réglisse 😍 j'en prends un sachet à chaque fois", ilYaHeures: 9, jaimes: ["lea", "jade"] },
  { id: "c-1-2", publicationId: "lieu-1", auteur: "lieu", texte: "Fournée du soir à -30 % jusqu'à 19h30, passe nous voir !", ilYaHeures: 8, jaimes: ["ines"] },
  { id: "c-6-1", publicationId: "lieu-6", auteur: "tom", texte: "Fait dimanche dernier, l'eau était parfaite. Prenez de la crème solaire 😎", ilYaHeures: 30, jaimes: ["sofia"] },
  { id: "c-9-1", publicationId: "lieu-9", auteur: "max", texte: "La vraie tielle sétoise, pas celle des supermarchés. Respect Pépita 🐙", ilYaHeures: 12, jaimes: ["lea", "karim", "camille"] },
  { id: "c-9-2", publicationId: "lieu-9", auteur: "sofia", texte: "Elle est épicée ou pas trop ?", ilYaHeures: 11 },
  { id: "c-9-3", publicationId: "lieu-9", auteur: "lieu", texte: "Juste ce qu'il faut ! Et on a une version douce pour les petits palais 😉", ilYaHeures: 10, reponseA: "c-9-2", jaimes: ["sofia"] },
  { id: "c-13-1", publicationId: "lieu-13", auteur: "lea", texte: "Le meilleur coucher de soleil de l'étang, avec les huîtres en prime 🌅", ilYaHeures: 3, jaimes: ["karim", "tom"] },
  { id: "c-13-2", publicationId: "lieu-13", auteur: "karim", texte: "@lea.croque tu m'avais dit qu'on y allait ensemble 👀", ilYaHeures: 2, reponseA: "c-13-1", mentions: ["lea.croque"] },
  { id: "c-cr1-1", publicationId: "createur-1", auteur: "jade", texte: "Trop bien la vidéo, ça donne faim !", ilYaHeures: 15, jaimes: ["ines"] },
  { id: "c-cr1-2", publicationId: "createur-1", auteur: "camille", texte: "Merci pour la découverte, je ne connaissais pas", ilYaHeures: 14 },
];

/** Les commentaires de la démo, datés à partir de maintenant. */
export function creerCommentairesExemples(maintenant: Date): Commentaire[] {
  return brouillons.map(({ ilYaHeures, jaimes, mentions, ...commentaire }) => ({
    ...commentaire,
    date: new Date(maintenant.getTime() - ilYaHeures * 3_600_000).toISOString(),
    jaimes: jaimes ?? [],
    mentions: mentions ?? [],
  }));
}
