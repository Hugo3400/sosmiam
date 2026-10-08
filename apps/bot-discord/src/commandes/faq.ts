import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { LIENS } from "../contenus/liens.ts";
import { QUESTIONS_FAQ, THEMES_FAQ } from "../contenus/questions-faq.ts";
import { chercherQuestions } from "../fonctions/texte/chercher-questions.ts";
import { creerMessageReponseFaq } from "../messages/creer-message-reponse-faq.ts";
import type { Commande } from "./type-commande.ts";

const OPTION = "question";

export const faq: Commande = {
  definition: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Tes questions sur SOS Miam, nos réponses")
    .addStringOption((option) =>
      option
        .setName(OPTION)
        .setDescription("Tape quelques mots : gratuit, rescousse, BIG SOS, ambassadeur…")
        .setRequired(true)
        .setMaxLength(100)
        .setAutocomplete(true),
    ),

  async completer(interaction) {
    const trouvees = chercherQuestions(QUESTIONS_FAQ, interaction.options.getFocused());
    await interaction.respond(
      trouvees.map((q) => ({ name: `${THEMES_FAQ[q.theme].emoji} ${q.question}`.slice(0, 100), value: q.id })),
    );
  },

  async executer(interaction) {
    const saisie = interaction.options.getString(OPTION, true);
    // Question choisie dans la liste : on reçoit son id. Texte tapé sans choisir : on prend la meilleure correspondance.
    const question = QUESTIONS_FAQ.find((q) => q.id === saisie) ?? chercherQuestions(QUESTIONS_FAQ, saisie, 1)[0];
    if (!question) {
      await interaction.reply({
        content: `Je n'ai rien trouvé pour « ${saisie} » 🤔 Essaie d'autres mots, pose ta question ici (quelqu'un aura sûrement la réponse), ou écris à **${LIENS.email}**.`,
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
      return;
    }
    await interaction.reply({ components: [creerMessageReponseFaq(question)], flags: MessageFlags.IsComponentsV2 });
  },
};
