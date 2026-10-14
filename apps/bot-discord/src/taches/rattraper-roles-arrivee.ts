// Au démarrage, donne le rôle d'arrivée aux membres arrivés pendant que le bot était éteint (et à ceux d'avant son réglage).
import type { Client } from "discord.js";
import { intentMembres } from "../configuration.ts";
import { donnerRoleArrivee } from "../fonctions/discord/donner-role-arrivee.ts";
import { expliquerRefusRole } from "../fonctions/discord/expliquer-refus-role.ts";
import { lireReglages } from "../stockage/reglages-serveurs.ts";

export async function rattraperRolesArrivee(client: Client<true>): Promise<void> {
  if (!intentMembres) return;
  for (const serveur of client.guilds.cache.values()) {
    const { roleArrivee } = lireReglages(serveur.id);
    if (!roleArrivee) continue;
    const role = serveur.roles.cache.get(roleArrivee);
    const refus = role ? expliquerRefusRole(role) : "il n'existe plus";
    if (refus) {
      console.error(`Rôle d'arrivée de « ${serveur.name} » non donné : ${refus}.`);
      continue;
    }
    const sansRole = (await serveur.members.fetch()).filter((m) => !m.user.bot && !m.roles.cache.has(roleArrivee));
    for (const membre of sansRole.values()) await donnerRoleArrivee(membre);
    if (sansRole.size > 0) console.log(`Rôle d'arrivée donné à ${sansRole.size} membre(s) de « ${serveur.name} ».`);
  }
}
