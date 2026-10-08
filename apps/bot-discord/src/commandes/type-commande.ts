import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

/** Une commande slash : sa définition (envoyée à Discord) et ce qu'elle fait. */
export type Commande = {
  definition: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  executer: (interaction: ChatInputCommandInteraction<"cached">) => Promise<unknown>;
  /** Suggestions pendant que la personne tape une option (autocomplétion). */
  completer?: (interaction: AutocompleteInteraction<"cached">) => Promise<unknown>;
  /** Formulaire envoyé : son identifiant commence par le nom de la commande (« proposer-lieu », « proposer-lieu:… »). */
  recevoirFormulaire?: (interaction: ModalSubmitInteraction<"cached">) => Promise<unknown>;
};
