// /config : choisir les salons du bot. Réservé à ceux qui peuvent gérer le serveur.
import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  channelMention,
  type ChatInputCommandInteraction,
  type PermissionsString,
} from "discord.js";
import { intentMembres } from "../configuration.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";
import { lireReglages, modifierReglages, type ReglagesServeur } from "../stockage/reglages-serveurs.ts";
import type { Commande } from "./type-commande.ts";

/** Chaque salon réglable, et les droits dont le bot a besoin dedans. */
const SALONS = {
  bienvenue: {
    cle: "salonBienvenue",
    libelle: "Accueil des nouveaux membres",
    droits: ["ViewChannel", "SendMessages"],
  },
  propositions: {
    cle: "salonPropositions",
    libelle: "Propositions de lieux",
    droits: ["ViewChannel", "SendMessages", "AddReactions", "ReadMessageHistory"],
  },
} as const satisfies Record<string, { cle: keyof ReglagesServeur; libelle: string; droits: PermissionsString[] }>;

const NOMS_DROITS: Partial<Record<PermissionsString, string>> = {
  ViewChannel: "Voir le salon",
  SendMessages: "Envoyer des messages",
  AddReactions: "Ajouter des réactions",
  ReadMessageHistory: "Voir les anciens messages",
};

const AVERTISSEMENT_INTENT =
  "⚠️ L'accueil ne marchera qu'une fois l'intent « Server Members » activé dans le portail Discord et `INTENT_MEMBRES=1` dans le .env du bot.";

export const config: Commande = {
  definition: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Régler le bot : salons d'accueil et de propositions")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sous) => sous.setName("voir").setDescription("Affiche les réglages actuels"))
    .addSubcommand((sous) =>
      sous
        .setName("bienvenue")
        .setDescription("Salon où j'accueille les nouveaux membres (laisse vide pour désactiver)")
        .addChannelOption((o) => o.setName("salon").setDescription("Salon textuel").addChannelTypes(ChannelType.GuildText)),
    )
    .addSubcommand((sous) =>
      sous
        .setName("propositions")
        .setDescription("Salon où arrivent les /proposer-lieu (laisse vide pour désactiver)")
        .addChannelOption((o) => o.setName("salon").setDescription("Salon textuel").addChannelTypes(ChannelType.GuildText)),
    ),

  async executer(interaction) {
    const sous = interaction.options.getSubcommand();
    if (sous === "voir") return afficherReglages(interaction);
    if (sous !== "bienvenue" && sous !== "propositions") return;

    const { cle, libelle, droits } = SALONS[sous];
    const salon = interaction.options.getChannel("salon", false, [ChannelType.GuildText]);
    if (!salon) {
      modifierReglages(interaction.guildId, { [cle]: undefined });
      await interaction.reply({ content: `${libelle} : désactivé.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const manquants = salon.permissionsFor(interaction.guild.members.me ?? interaction.client.user)?.missing([...droits]) ?? [...droits];
    if (manquants.length > 0) {
      const liste = manquants.map((d) => NOMS_DROITS[d] ?? d).join(", ");
      await interaction.reply({
        content: `Il me manque des droits dans ${channelMention(salon.id)} : **${liste}**. Donne-les moi, puis relance la commande.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    modifierReglages(interaction.guildId, { [cle]: salon.id });
    const avertissement = sous === "bienvenue" && !intentMembres ? `\n${AVERTISSEMENT_INTENT}` : "";
    await interaction.reply({ content: `${libelle} : ${channelMention(salon.id)} ✅${avertissement}`, flags: MessageFlags.Ephemeral });
  },
};

async function afficherReglages(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
  const reglages = lireReglages(interaction.guildId);
  const lignes = Object.values(SALONS).map(({ cle, libelle }) => {
    const id = reglages[cle];
    return `**${libelle}** · ${id ? channelMention(id) : "désactivé"}`;
  });
  if (reglages.salonBienvenue && !intentMembres) lignes.push(`\n${AVERTISSEMENT_INTENT}`);
  await interaction.reply({
    components: [creerBloc({ couleur: COULEURS.jaune, parties: ["### ⚙️ Réglages du bot", lignes.join("\n")] })],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  });
}
