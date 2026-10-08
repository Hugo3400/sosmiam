// Message posté dans le salon de bienvenue quand quelqu'un rejoint le serveur.
import type { ContainerBuilder, GuildMember } from "discord.js";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

/** Une phrase tirée au hasard, pour que l'accueil ne sonne pas comme un répondeur. */
const ACCROCHES = [
  (nom: string) => `Une table de plus pour ${nom} ! Installe-toi, la carte arrive.`,
  (nom: string) => `${nom} vient d'arriver, et on sent déjà une bonne odeur de pépite.`,
  (nom: string) => `Bouée lancée, ${nom} est à bord 🛟`,
  (nom: string) => `${nom} rejoint l'équipe des sauveteurs de tables. Bienvenue !`,
  (nom: string) => `Coucou ${nom} ! Ici, on parle bonnes adresses et on se serre les coudes pour les lieux indépendants.`,
];

export function creerMessageBienvenue(membre: GuildMember): ContainerBuilder {
  const accroche = ACCROCHES[Math.floor(Math.random() * ACCROCHES.length)];
  return creerBloc({
    couleur: COULEURS.jaune,
    vignette: membre.displayAvatarURL({ size: 256 }),
    parties: [
      `## Bienvenue ! 👋\n${accroche(membre.toString())}`,
      "Pour bien démarrer :\n`/sosmiam` · SOS Miam en 30 secondes\n`/faq` · tes questions, nos réponses\n`/proposer-lieu` · fais découvrir ta pépite du coin",
    ],
    pied: `Tu es le membre n°${membre.guild.memberCount}`,
  });
}
