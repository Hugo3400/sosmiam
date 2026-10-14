import { MessageFlags, type GuildMember } from "discord.js";
import { donnerRoleArrivee } from "../fonctions/discord/donner-role-arrivee.ts";
import { creerMessageBienvenue } from "../messages/creer-message-bienvenue.ts";
import { lireReglages } from "../stockage/reglages-serveurs.ts";

/** Donne le rôle d'arrivée et souhaite la bienvenue dans le salon choisi avec /config (intent « Server Members » nécessaire). */
export async function accueillirMembre(membre: GuildMember): Promise<void> {
  if (membre.user.bot) return;
  await donnerRoleArrivee(membre).catch((e) => console.error("Rôle d'arrivée impossible à donner :", e));
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
