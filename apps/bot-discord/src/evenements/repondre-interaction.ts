import type { Interaction } from "discord.js";
import { commandes } from "../commandes/liste-commandes.ts";
import { signalerErreur } from "../fonctions/discord/signaler-erreur.ts";

/** Aiguille chaque interaction vers sa commande : commande tapée, autocomplétion ou formulaire envoyé. */
export async function repondreInteraction(interaction: Interaction): Promise<void> {
  // Les commandes sont enregistrées serveur par serveur : rien à faire en message privé.
  if (!interaction.inCachedGuild()) return;
  try {
    if (interaction.isChatInputCommand()) {
      await commandes.get(interaction.commandName)?.executer(interaction);
    } else if (interaction.isAutocomplete()) {
      await commandes.get(interaction.commandName)?.completer?.(interaction);
    } else if (interaction.isModalSubmit()) {
      const [nomCommande] = interaction.customId.split(":");
      await commandes.get(nomCommande)?.recevoirFormulaire?.(interaction);
    }
  } catch (erreur) {
    const contexte = interaction.isCommand() || interaction.isAutocomplete() ? `/${interaction.commandName}` : interaction.type.toString();
    await signalerErreur(interaction, erreur, contexte);
  }
}
