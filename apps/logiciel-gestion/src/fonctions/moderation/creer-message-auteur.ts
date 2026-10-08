import { MOTIFS_MODERATION } from "../../contenus/motifs-moderation.ts";

export type DecisionAMotiver = {
  decision: "retenu" | "rejete";
  motif: string | null;
  motivation: string | null;
  /** Contenu concerné, en quelques mots (« ta vidéo chez Chez Lia : “La cacio e pepe…” ») */
  contenu: string;
  /** Masquée automatiquement dès le premier signalement (raison grave), avant l'examen */
  masqueeDesLeSignalement: boolean;
  reexamen: boolean;
};

/**
 * Le message à l'auteur d'un contenu retiré, avec ce que le règlement européen sur les services numériques demande
 * (art. 17) : ce qu'on a fait, pourquoi (la règle et les faits), qu'une personne a décidé, et comment contester. Rien de
 * plus que ce que promettent les CGU.
 */
export function creerMessageAuteur({ decision, motif, motivation, contenu, masqueeDesLeSignalement, reexamen }: DecisionAMotiver): string {
  const regle = motif ? MOTIFS_MODERATION[motif]?.regle : null;
  const lignes = ["Salut,", ""];
  if (decision === "rejete") {
    lignes.push(
      reexamen
        ? `On a réexaminé notre décision sur ${contenu} : tu avais raison, elle est de nouveau en ligne. Désolé pour le dérangement.`
        : `${contenu} a été signalé${masqueeDesLeSignalement ? " et masqué le temps qu'on regarde" : ""}. On l'a examiné : il respecte nos règles, il reste en ligne.`,
    );
  } else {
    lignes.push(
      reexamen ? `On a réexaminé notre décision sur ${contenu}, comme tu nous l'as demandé : on la maintient, il reste retiré de SOS Miam.` : `On a retiré ${contenu} de SOS Miam, après un signalement.`,
      "",
      `Pourquoi : il ne respecte pas cette règle de nos conditions d'utilisation (https://sosmiam.fr/cgu) : ${regle ?? "nos règles de la communauté"}.`,
      ...(motivation ? ["", motivation] : []),
    );
    if (masqueeDesLeSignalement) lignes.push("", "Comme le prévoient nos conditions, il avait été masqué pour tout le monde dès le premier signalement, en attendant notre examen.");
    lignes.push(
      "",
      "C'est une personne de l'équipe qui a pris cette décision, pas un algorithme.",
      "",
      reexamen
        ? "Tu gardes la possibilité de saisir la justice."
        : "Pas d'accord ? Réponds simplement à ce mail en nous expliquant pourquoi : on réexaminera la décision. Tu gardes aussi la possibilité de saisir la justice.",
    );
  }
  lignes.push("", "L'équipe SOS Miam");
  return lignes.join("\n");
}
