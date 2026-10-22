import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";

// Conversations d'exemple (démo) avec les potes d'exemple (potes-exemples.ts). Datées à partir d'aujourd'hui.

const ilYa = (maintenant: Date, minutes: number) => new Date(maintenant.getTime() - minutes * 60_000).toISOString();

/** Les conversations de la démo : un message privé avec Léa, un avec Inès, et le groupe du jeudi. */
export function creerConversationsExemples(maintenant: Date): ConversationEnrichie[] {
  return [
    {
      id: "prive-lea",
      type: "prive",
      participants: [ID_MOI, "lea"],
      creePar: "lea",
      messages: [
        { id: "pl1", auteur: "lea", date: ilYa(maintenant, 95), type: "texte", texte: "T'as vu ? Les huîtres de Bouzigues sont en SOS ce soir 🦪", reactions: {} },
        { id: "pl2", auteur: "lea", date: ilYa(maintenant, 94), type: "lieu", lieuId: 13, reactions: {} },
        { id: "pl3", auteur: "lea", date: ilYa(maintenant, 40), type: "texte", texte: "Dis-moi si t'es chaud, je réserve 😋", reactions: {} },
      ],
      luJusqua: ilYa(maintenant, 94),
    },
    {
      id: "prive-ines",
      type: "prive",
      participants: [ID_MOI, "ines"],
      creePar: "ines",
      messages: [
        { id: "pi1", auteur: "ines", date: ilYa(maintenant, 300), type: "texte", texte: "Merci pour les choux de la dernière fois, c'était trop bon 🧁", reactions: { "❤️": [ID_MOI] } },
        {
          id: "pi2",
          auteur: ID_MOI,
          date: ilYa(maintenant, 290),
          type: "texte",
          texte: "Avec plaisir ! La prochaine fois, c'est toi qui choisis la pâtisserie 🥐",
          reactions: {},
          reponseA: { id: "pi1", auteur: "ines", type: "texte", extrait: "Merci pour les choux de la dernière fois, c'était trop bon 🧁", etat: "visible" },
          modifieLe: ilYa(maintenant, 288),
        },
      ],
      luJusqua: ilYa(maintenant, 290),
      lectures: [{ membre: "ines", luJusqua: "pi2", luLe: ilYa(maintenant, 120) }],
    },
    {
      id: "groupe-jeudi",
      type: "groupe",
      titre: "La bande du jeudi",
      emoji: "🎲",
      participants: [ID_MOI, "lea", "karim", "tom"],
      creePar: "karim",
      messages: [
        { id: "gj1", auteur: "karim", date: ilYa(maintenant, 600), type: "texte", texte: "Quiz jeudi soir, qui est dispo ?", reactions: { "👍": ["lea", "tom"] } },
        { id: "gj2", auteur: "tom", date: ilYa(maintenant, 590), type: "texte", texte: "Moi ! On se fait une tielle avant ?", reactions: { "😋": ["karim"] } },
        { id: "gj3", auteur: "lea", date: ilYa(maintenant, 580), type: "lieu", lieuId: 9, reactions: {} },
        { id: "gj4", auteur: "karim", date: ilYa(maintenant, 575), type: "texte", texte: "@lea.croque tu nous gardes une table ? 🙏", reactions: {}, mentions: ["lea"] },
        { id: "gj5", auteur: "", date: ilYa(maintenant, 520), type: "texte", texte: "Le vote est fini : La Tielle de Pépita gagne avec 3 voix sur 4.", reactions: { "😋": ["tom"] }, systeme: "sondage-clos" },
      ],
      luJusqua: ilYa(maintenant, 590),
      epinglee: true,
    },
  ];
}
