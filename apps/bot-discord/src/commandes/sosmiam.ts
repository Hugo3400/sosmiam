import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { creerMessagePresentation } from "../messages/creer-message-presentation.ts";
import type { Commande } from "./type-commande.ts";

export const sosmiam: Commande = {
  definition: new SlashCommandBuilder()
    .setName("sosmiam")
    .setDescription("SOS Miam en 30 secondes : le concept, les rescousses, le BIG SOS"),
  async executer(interaction) {
    await interaction.reply({ components: [creerMessagePresentation()], flags: MessageFlags.IsComponentsV2 });
  },
};
