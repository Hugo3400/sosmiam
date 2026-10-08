import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { creerMessageContact } from "../messages/creer-message-contact.ts";
import type { Commande } from "./type-commande.ts";

export const contact: Commande = {
  definition: new SlashCommandBuilder()
    .setName("contact")
    .setDescription("Écrire à l'équipe : newsletter, inscrire ton lieu, devenir ambassadeur"),
  async executer(interaction) {
    await interaction.reply({ components: [creerMessageContact()], flags: MessageFlags.IsComponentsV2 });
  },
};
