// Point d'entrée du bot Discord de SOS Miam : connexion, enregistrement des commandes, événements.
// Lancement : npm start (ou npm run dev, qui relance à chaque modification). Réglages : .env (modèle : .env.exemple).
import { ActivityType, Client, Events, GatewayIntentBits, OAuth2Scopes, PermissionFlagsBits, type Guild } from "discord.js";
import { commandes } from "./commandes/liste-commandes.ts";
import { intentMembres, lireJeton } from "./configuration.ts";
import { accueillirMembre } from "./evenements/accueillir-membre.ts";
import { repondreInteraction } from "./evenements/repondre-interaction.ts";
import { demarrerPublicationAnnonces } from "./taches/publier-annonces.ts";

/** Droits demandés par le lien d'invitation : lire et écrire, réagir aux propositions. */
const DROITS_BOT = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.ReadMessageHistory,
];

const intents = [GatewayIntentBits.Guilds];
if (intentMembres) intents.push(GatewayIntentBits.GuildMembers);

const client = new Client({
  intents,
  presence: { activities: [{ type: ActivityType.Custom, name: "statut", state: "🛟 Sauve une table, régale-toi · /sosmiam" }] },
});
const definitions = [...commandes.values()].map((commande) => commande.definition.toJSON());

/** Commandes enregistrées serveur par serveur : disponibles tout de suite, sans ID d'application à configurer. */
async function enregistrerCommandes(serveur: Guild): Promise<void> {
  await serveur.commands.set(definitions);
  console.log(`Commandes enregistrées sur « ${serveur.name} » (${serveur.id})`);
}

client.once(Events.ClientReady, async (pret) => {
  console.log(`Connecté en tant que ${pret.user.tag}`);
  const invitation = pret.generateInvite({ scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands], permissions: DROITS_BOT });
  console.log(`Lien d'invitation : ${invitation}`);
  if (pret.guilds.cache.size === 0) console.log("Je ne suis sur aucun serveur : invite-moi avec le lien ci-dessus.");
  for (const serveur of pret.guilds.cache.values()) await enregistrerCommandes(serveur).catch(console.error);
  if (!intentMembres) console.log("Accueil des nouveaux membres désactivé (INTENT_MEMBRES=0).");
  demarrerPublicationAnnonces(pret);
});

client.on(Events.GuildCreate, (serveur) => void enregistrerCommandes(serveur).catch(console.error));
client.on(Events.InteractionCreate, (interaction) => void repondreInteraction(interaction));
client.on(Events.GuildMemberAdd, (membre) => void accueillirMembre(membre).catch((e) => console.error("Accueil impossible :", e)));
client.on(Events.Error, (erreur) => console.error("Erreur Discord :", erreur));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void client.destroy().finally(() => process.exit(0)));
}

try {
  await client.login(lireJeton());
} catch (erreur) {
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  if (/disallowed intents/i.test(message)) {
    console.error("Intent refusé : active « Server Members Intent » dans le portail Discord (onglet Bot), ou mets INTENT_MEMBRES=0.");
  } else if ((erreur as { code?: string }).code === "TokenInvalid") {
    console.error("Jeton refusé par Discord : vérifie DISCORD_JETON dans .env (ou régénère-le dans le portail, onglet Bot).");
  } else {
    console.error(`Connexion impossible : ${message}`);
  }
  process.exit(1);
}
