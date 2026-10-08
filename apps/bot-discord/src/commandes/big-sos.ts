import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { creerMessageBigSos } from "../messages/creer-message-big-sos.ts";
import type { Commande } from "./type-commande.ts";

export const bigSos: Commande = {
  definition: new SlashCommandBuilder()
    .setName("big-sos")
    .setDescription("L'alerte rouge de SOS Miam : comment un lieu en difficulté est mis à la une"),
  async executer(interaction) {
    await interaction.reply({ components: [creerMessageBigSos()], flags: MessageFlags.IsComponentsV2 });
  },
};
