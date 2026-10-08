import { MOTIFS_MODERATION } from "../../contenus/motifs-moderation.ts";

/**
 * La réponse à la personne qui a signalé : ce qu'on a décidé (les CGU promettent qu'elle le saura), et comment
 * contester si elle n'est pas d'accord.
 */
export function creerReponseSignalement({ decision, motif, dateSignalement, contenu }: { decision: "retenu" | "rejete"; motif: string | null; dateSignalement: string; contenu: string }): string {
  const regle = motif ? MOTIFS_MODERATION[motif]?.libelle.toLowerCase() : null;
  return [
    "Salut,",
    "",
    `Merci pour ton signalement du ${dateSignalement} sur ${contenu}. On l'a examiné à la main.`,
    "",
    decision === "retenu"
      ? `Tu avais raison : il ne respectait pas nos règles${regle ? ` (${regle})` : ""}, on l'a retiré de SOS Miam.`
      : "Après examen, il respecte nos règles de la communauté : il reste en ligne.",
    "",
    "Pas d'accord avec cette décision ? Réponds simplement à ce mail : on la réexaminera.",
    "",
    "L'équipe SOS Miam",
  ].join("\n");
}
