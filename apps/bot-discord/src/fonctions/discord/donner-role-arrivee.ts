import type { GuildMember } from "discord.js";
import { lireReglages } from "../../stockage/reglages-serveurs.ts";
import { expliquerRefusRole } from "./expliquer-refus-role.ts";

/** Donne le rôle choisi avec /config role-arrivee, s'il est sans danger et que la personne ne l'a pas déjà. */
export async function donnerRoleArrivee(membre: GuildMember): Promise<void> {
  const { roleArrivee } = lireReglages(membre.guild.id);
  if (!roleArrivee || membre.user.bot || membre.roles.cache.has(roleArrivee)) return;
  const role = membre.guild.roles.cache.get(roleArrivee);
  if (!role) return;
  const refus = expliquerRefusRole(role);
  if (refus) {
    console.error(`Rôle d'arrivée « ${role.name} » non donné : ${refus}.`);
    return;
  }
  await membre.roles.add(role, "Rôle donné à chaque arrivée (/config role-arrivee)");
}
