import { MessageFlags, type Interaction } from "discord.js";

/** Note l'erreur dans les journaux et prévient la personne, sans jamais faire planter le bot. */
export async function signalerErreur(interaction: Interaction, erreur: unknown, contexte: string): Promise<void> {
  console.error(`Erreur (${contexte}) :`, erreur);
  if (interaction.isAutocomplete()) {
    if (!interaction.responded) await interaction.respond([]).catch(() => {});
    return;
  }
  if (!interaction.isRepliable()) return;
  const message = {
    content: "Oups, j'ai renversé la sauce 🫠 Réessaie dans un instant, et si ça recommence, préviens un modo.",
    flags: MessageFlags.Ephemeral,
  } as const;
  await (interaction.replied || interaction.deferred ? interaction.followUp(message) : interaction.reply(message)).catch(() => {});
}
