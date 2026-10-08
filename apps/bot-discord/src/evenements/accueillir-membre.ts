import { MessageFlags, type GuildMember } from "discord.js";
import { creerMessageBienvenue } from "../messages/creer-message-bienvenue.ts";
import { lireReglages } from "../stockage/reglages-serveurs.ts";

/** Souhaite la bienvenue dans le salon choisi avec /config bienvenue (intent « Server Members » nécessaire). */
export async function accueillirMembre(membre: GuildMember): Promise<void> {
  if (membre.user.bot) return;
  const { salonBienvenue } = lireReglages(membre.guild.id);
  if (!salonBienvenue) return;
  const salon = await membre.guild.channels.fetch(salonBienvenue).catch(() => null);
  if (!salon?.isSendable()) return;
  await salon.send({
    components: [creerMessageBienvenue(membre)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: [membre.id] },
  });
}
