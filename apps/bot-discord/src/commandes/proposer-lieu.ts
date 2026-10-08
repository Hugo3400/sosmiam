// /proposer-lieu : un formulaire, puis la proposition est postée dans le salon choisi avec /config propositions.
import { MessageFlags, SlashCommandBuilder, type ModalSubmitInteraction } from "discord.js";
import { LIENS } from "../contenus/liens.ts";
import { TYPES_LIEUX } from "../contenus/types-lieux.ts";
import { CHAMPS_PROPOSITION as CHAMPS, creerFormulaireProposition } from "../messages/creer-formulaire-proposition.ts";
import { creerMessageProposition, type Proposition } from "../messages/creer-message-proposition.ts";
import { lireReglages } from "../stockage/reglages-serveurs.ts";
import type { Commande } from "./type-commande.ts";

const NOM_COMMANDE = "proposer-lieu";
/** Une proposition par minute et par personne : de quoi décourager le spam sans gêner personne. */
const ATTENTE_MS = 60_000;
const dernieresPropositions = new Map<string, number>();

export const proposerLieu: Commande = {
  definition: new SlashCommandBuilder()
    .setName(NOM_COMMANDE)
    .setDescription("Fais découvrir une pépite indépendante qui mérite du monde"),

  async executer(interaction) {
    if (!lireReglages(interaction.guildId).salonPropositions) {
      await interaction.reply({
        content: `Les propositions ne sont pas encore ouvertes ici : un admin doit d'abord choisir leur salon avec \`/config propositions\`. En attendant, ta pépite peut partir par mail à **${LIENS.email}** 💌`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const attente = (dernieresPropositions.get(interaction.user.id) ?? 0) + ATTENTE_MS - Date.now();
    if (attente > 0) {
      await interaction.reply({
        content: `Doucement, sauveteur 🛟 Encore ${Math.ceil(attente / 1000)} secondes avant ta prochaine pépite.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.showModal(creerFormulaireProposition(NOM_COMMANDE));
  },

  async recevoirFormulaire(interaction) {
    // Envoyer dans le salon peut prendre plus que les 3 secondes laissées par Discord : on accuse réception d'abord.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const proposition = lireProposition(interaction);
    const idSalon = lireReglages(interaction.guildId).salonPropositions;
    const salon = idSalon ? await interaction.guild.channels.fetch(idSalon).catch(() => null) : null;
    if (!salon?.isSendable()) {
      await interaction.editReply(
        `Le salon des propositions a disparu ou m'est fermé 😕 Préviens un admin (\`/config propositions\`). Pour ne pas perdre ta pépite, la voici :\n**${proposition.nom}** (${proposition.ville}) : ${proposition.pourquoi}`,
      );
      return;
    }
    const message = await salon.send({
      components: [creerMessageProposition(proposition, interaction.user)],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
    dernieresPropositions.set(interaction.user.id, Date.now());
    await message.react("😋").catch(() => {});
    await interaction.editReply(`Merci ! Ta pépite est partie dans ${salon} 🛟 La communauté peut la soutenir avec 😋`);
  },
};

function lireProposition(interaction: ModalSubmitInteraction<"cached">): Proposition {
  const lire = (champ: string) => interaction.fields.getTextInputValue(champ).trim();
  const [valeurType] = interaction.fields.getStringSelectValues(CHAMPS.type);
  return {
    nom: lire(CHAMPS.nom),
    ville: lire(CHAMPS.ville),
    type: TYPES_LIEUX.find((t) => t.valeur === valeurType) ?? TYPES_LIEUX[TYPES_LIEUX.length - 1],
    pourquoi: lire(CHAMPS.pourquoi),
    lien: lire(CHAMPS.lien),
  };
}
