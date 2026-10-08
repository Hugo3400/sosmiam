// /publier : poste un message fixe (règlement, présentation) dans le salon où la commande est tapée.
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { creerMessagePresentation } from "../messages/creer-message-presentation.ts";
import { creerMessageReglement } from "../messages/creer-message-reglement.ts";
import type { Commande } from "./type-commande.ts";

const MESSAGES = {
  reglement: { libelle: "📜 Règlement du serveur", creer: creerMessageReglement },
  presentation: { libelle: "🛟 Présentation de SOS Miam", creer: creerMessagePresentation },
};

export const publier: Commande = {
  definition: new SlashCommandBuilder()
    .setName("publier")
    .setDescription("Publie un message fixe dans ce salon (règlement, présentation)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Le message à publier")
        .setRequired(true)
        .addChoices(Object.entries(MESSAGES).map(([valeur, { libelle }]) => ({ name: libelle, value: valeur }))),
    ),

  async executer(interaction) {
    const choix = interaction.options.getString("message", true) as keyof typeof MESSAGES;
    const salon = interaction.channel;
    if (!salon?.isSendable() || !interaction.appPermissions.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
      await interaction.reply({ content: "Je n'ai pas le droit d'écrire dans ce salon 😶 Donne-moi « Envoyer des messages », puis réessaie.", flags: MessageFlags.Ephemeral });
      return;
    }
    await salon.send({ components: [MESSAGES[choix].creer()], flags: MessageFlags.IsComponentsV2 });
    await interaction.reply({ content: `${MESSAGES[choix].libelle} : publié ✅`, flags: MessageFlags.Ephemeral });
  },
};
