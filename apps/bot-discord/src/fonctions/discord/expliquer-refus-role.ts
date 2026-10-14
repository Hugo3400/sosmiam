import { PermissionFlagsBits, type Role } from "discord.js";

/** Droits qu'un rôle donné à tout le monde ne doit jamais ouvrir. */
const DROITS_DE_GESTION = {
  Administrator: "administrateur",
  ManageGuild: "gérer le serveur",
  ManageRoles: "gérer les rôles",
  ManageChannels: "gérer les salons",
  ManageMessages: "gérer les messages",
  ManageThreads: "gérer les fils",
  ManageWebhooks: "gérer les webhooks",
  ManageNicknames: "gérer les pseudos",
  ManageEvents: "gérer les événements",
  ManageGuildExpressions: "gérer les emojis",
  KickMembers: "expulser",
  BanMembers: "bannir",
  ModerateMembers: "exclure temporairement",
  MentionEveryone: "mentionner @everyone",
  ViewAuditLog: "voir les logs du serveur",
} as const satisfies Partial<Record<keyof typeof PermissionFlagsBits, string>>;

/** Pourquoi le bot refuse de donner ce rôle à chaque arrivée, ou `null` s'il peut le donner sans risque. */
export function expliquerRefusRole(role: Role): string | null {
  if (role.id === role.guild.id) return "c'est @everyone, que tout le monde a déjà";
  if (role.managed) return "il appartient à un bot ou à une intégration";
  const droits = Object.entries(DROITS_DE_GESTION)
    .filter(([droit]) => role.permissions.has(PermissionFlagsBits[droit as keyof typeof DROITS_DE_GESTION], false))
    .map(([, nom]) => nom);
  if (droits.length > 0) return `il donne des droits de gestion (${droits.join(", ")})`;
  if (!role.editable) return "il est au-dessus de mon rôle, ou je n'ai pas le droit « Gérer les rôles »";
  return null;
}
