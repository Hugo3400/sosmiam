// Conditions d'utilisation, section « Le programme Ambassadeurs », reprise par cgu.ts. Son id « ambassadeurs » ne doit pas
// changer : la case à cocher de /inscription y renvoie (https://sosmiam.fr/cgu#ambassadeurs).
// Décisions : docs/decisions.md, « Espace ambassadeur », « Fondateurs par ville » et « Ambassadeur certifié ». Influence commerciale : loi n° 2023-451 du 9 juin 2023.
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienEspace = `[${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})`;

export const sectionAmbassadeursCgu: SectionLegale = {
  id: "ambassadeurs",
  titre: "Le programme Ambassadeurs",
  blocs: [
    `Sur ${lienEspace}, tu peux créer un compte pour devenir ambassadeur : faire découvrir les lieux indépendants de ton coin, nous en proposer et en parler autour de toi. En créant ce compte, tu acceptes ces conditions, et en particulier les règles ci-dessous.`,
    {
      liste: [
        "**Dès 18 ans.** Ta date de naissance sert seulement à le vérifier à l'inscription : elle n'est pas gardée. Mentir sur ton âge est interdit ; si on apprend qu'un compte appartient à quelqu'un de moins de 18 ans, on le supprime.",
        `**Un seul compte par personne**, avec des informations exactes et une adresse e-mail à toi : tu la confirmes en cliquant sur le lien reçu par mail à l'inscription. Ton prénom ou ton surnom peut s'afficher sur la fiche d'un lieu que tu as fait découvrir (« Déniché par… ») : choisis-en un que tu veux bien montrer. Garde ton mot de passe pour toi, et préviens-nous vite à ${lienContact} si quelqu'un d'autre utilise ton compte.`,
        "**Chaque inscription est validée par l'équipe**, à la main. L'équipe peut refuser une inscription sans avoir à en donner la raison. Tant que ton compte n'est pas validé, tu peux seulement voir où en est ton inscription et gérer ton compte.",
        "**Un programme de passionnés, pas un emploi** : pas de rémunération, ni horaires, ni objectifs. Tu participes quand tu veux, autant que tu veux, et tu peux arrêter à tout moment.",
        "**Jamais payé par un lieu que tu mets en avant.** Si un lieu t'offre quelque chose (un repas, un cadeau…), tu l'indiques clairement dans ce que tu publies, avec la mention « Collaboration commerciale », comme l'exige la loi n° 2023-451 du 9 juin 2023 sur l'influence commerciale.",
        "**Tu ne te fais pas passer pour SOS Miam** : tu parles en ton nom, comme ambassadeur, jamais au nom de SOS Miam ou de son équipe. Tu ne promets rien de notre part, ni à un lieu ni à personne (une fiche, une place à la une, un BIG SOS…). Et partout où tu parles de nous, les [règles de la communauté](#regles-communaute) s'appliquent aussi.",
        "**Le kit média** (logos, mascotte, badges, visuels et textes à partager) est réservé aux ambassadeurs validés. On t'accorde le droit de l'utiliser gratuitement, pour toi seul et sans but commercial, uniquement pour parler de SOS Miam, en suivant ses règles (par exemple, ne pas déformer ni recolorer le logo). Ce droit prend fin dès que tu n'es plus ambassadeur validé : compte supprimé, suspendu ou refusé, ou rôle d'ambassadeur retiré (que tu quittes le programme, qu'on t'en retire, ou après 1 an sans visite).",
        `**En cas d'abus** (fausses informations, faux lieux, collaboration commerciale cachée, kit média mal utilisé, propos blessants, se faire passer pour SOS Miam…), l'équipe peut suspendre ton compte. Un compte suspendu peut encore se connecter, voir son statut, corriger ses infos, changer son mot de passe et se supprimer, mais plus rien d'autre. Si tu penses qu'il y a une erreur, écris-nous à ${lienContact}.`,
        `**Supprimer ton compte** : à tout moment, depuis « Mon compte » dans ton espace (ton mot de passe t'est demandé), ou en nous écrivant à ${lienContact} depuis l'adresse de ton compte. Après 1 an sans aucune visite dans l'espace, le rôle d'ambassadeur est retiré ; après 2 ans sans connexion, le compte est effacé (un mail prévient un mois avant) ; un compte refusé est effacé 30 jours après le refus : tout est détaillé dans la [politique de confidentialité](/confidentialite#compte-ambassadeur).`,
        "**Les fondateurs** : une fois ton compte validé, tu peux candidater depuis ton espace pour la ville où tu vis, ou pour ton département (ou ta collectivité d'outre-mer) si ta commune a moins de 50 000 habitants. Chaque ville et chaque département n'a que quelques places : l'équipe choisit, une candidature peut ne pas être retenue, et tu restes alors ambassadeur, comme avant. Quand toutes les places d'une ville ou d'un département sont prises, la candidature s'y ferme, et rouvre si une place se libère. Si tu déménages, tu gardes ton titre de fondateur en souvenir, mais ta place se libère ; ton numéro de fondateur n'est jamais redonné à quelqu'un d'autre.",
        "**Ambassadeur certifié** : un titre à part, qui s'ajoute à ton niveau, pour aider les lieux partenaires. L'équipe le donne, sur candidature depuis ton espace ou sur invitation, et peut le retirer à tout moment, par exemple si ces règles ne sont pas suivies. Une structure (asso, mairie, office de tourisme, école…) est représentée par une personne, avec son compte. Un ambassadeur certifié n'est **jamais payé par un lieu**, ni pour une mission ni pour autre chose : si un lieu lui offre quelque chose, il l'écrit « Collaboration commerciale ». Les **missions** chez les lieux partenaires sont confiées par l'équipe : tu les acceptes ou non, à ton rythme, sans rien promettre au lieu au nom de SOS Miam. Le **kit média pro** (affiche, flyer, mot de 30 secondes, mail type) suit les mêmes règles que le kit média, et ses propres règles écrites avec lui : tu ne demandes rien à un lieu en échange de son inscription, qui reste gratuite, et tu n'écris qu'à l'adresse que le lieu affiche lui-même. Ce droit prend fin avec le titre.",
        "**Points et badges** : comme dans l'app, ils n'ont aucune valeur en argent (voir « Rescousses, visites et badges »).",
      ],
    },
  ],
};
