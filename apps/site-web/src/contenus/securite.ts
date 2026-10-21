import type { CibleSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";
import {
  ANNEES_CONSERVATION_SECURITE,
  IMAGE_SIGNALEMENT_OCTETS_MAX,
  IMAGES_SIGNALEMENT_MAX,
  JOURS_PUBLICATION_SECURITE,
  JOURS_REPONSE_SECURITE,
} from "../../../../packages/commun/src/regles/securite.ts";

const MO_PAR_IMAGE = IMAGE_SIGNALEMENT_OCTETS_MAX / (1024 * 1024);

export const PROMESSE_BONNE_FOI =
  "Si tu respectes ces règles et agis de bonne foi, on considère ta recherche comme autorisée et on ne portera pas plainte contre toi.";

export const pageSecurite = {
  titre: "Chasse aux bugs",
  description:
    "Une faille de sécurité dans SOS Miam ? Signale-la : ce qui est dans le jeu, les règles, nos engagements, le badge Chasseur de bugs et le tableau d'honneur.",
  badge: "Sécurité",
  chapo: "Tu as trouvé une faille dans SOS Miam ? Dis-le-nous avant les petits malins : on la corrige, et on te remercie.",
  pourQui:
    "Chercheuse ou chercheur en sécurité, ou Miami curieux tombé sur un truc louche : lis les règles, puis raconte-nous tout dans le formulaire.",
  enUnCoupDOeil: [`Réponse sous ${JOURS_REPONSE_SECURITE} jours`, "Par le formulaire seulement", "Dès 18 ans"],
};

export const perimetreSecurite = {
  titre: "Ce qui est dans le jeu",
  chapo: "Tu peux chercher des failles ici :",
  dansLeJeu: [
    { nom: "sosmiam.fr", texte: "le site" },
    { nom: "ambassadeur.sosmiam.fr", texte: "l'espace ambassadeur" },
    { nom: "pro.sosmiam.fr", texte: "l'espace pro des lieux" },
    { nom: "api.sosmiam.fr", texte: "l'API, qui fait tourner l'app et le site" },
    { nom: "L'app SOS Miam", texte: "pour iPhone et Android" },
  ],
  deuxComptes:
    "**Avec tes propres comptes seulement.** Pour tester ce qui se passe entre deux personnes (bande, messages, réservations…), crée-toi deux comptes et joue les deux rôles.",
  horsJeuTitre: "Hors jeu",
  horsJeu: [
    "Le logiciel de gestion de l'équipe, et ses adresses en /api-gestion/ (même sur sosmiam.fr).",
    "Le bot et le serveur Discord de SOS Miam.",
    "Les services de nos prestataires : Cloudflare, Apple, Google, notre hébergeur et notre messagerie. Ils ont leurs propres programmes : passe par eux.",
    "Tout autre site ou service présent sur la même machine, son adresse IP et ses ports en dehors des adresses listées ici.",
  ],
};

export const reglesSecurite = {
  titre: "Les règles",
  chapo: "Une chasse aux bugs, pas une chasse aux Miamis. Pour que ta recherche reste du bon côté :",
  regles: [
    "**Les données des autres, on n'y touche pas** : ne les lis pas, ne les modifie pas, ne les garde pas, ne les efface pas. Si tu tombes dessus, arrête-toi là, ne garde rien et dis-le-nous.",
    "**Pas de déni de service**, ni de test de charge : SOS Miam doit rester debout pour tout le monde.",
    "**Pas de scanner automatique en rafale** : quelques requêtes bien visées valent mieux qu'une averse.",
    "**Pas d'ingénierie sociale** : ni la Brigade, ni les lieux, ni les Miamis. On cherche les failles du code, pas celles des gens.",
    "**Pas d'envoi d'e-mails en masse**, ni de spam.",
    "**Rien de visible par les autres** pour tester : pas d'avis, de sortie, d'idée, ni de message à des inconnus. Garde tes essais entre tes deux comptes.",
    "**Aucune action physique dans un lieu** : on teste l'app, pas la porte de la cuisine.",
    "**Dès 18 ans**, comme tout SOS Miam.",
    `**Motus et bouche cousue** : garde la faille pour toi jusqu'à sa correction (ou jusqu'à la fin des ${JOURS_PUBLICATION_SECURITE} jours, voir nos engagements).`,
  ],
  neCompteTitre: "Ce qui ne compte pas",
  neCompteChapo: "Pour gagner du temps des deux côtés, ces cas-là ne comptent pas comme une faille :",
  neCompte: [
    "le self-XSS (une faille qu'on ne peut déclencher que contre soi-même) ;",
    "un en-tête de sécurité absent, sans impact démontré ;",
    "un numéro de version visible ;",
    "le clickjacking sur une page sans action sensible ;",
    "les réglages SPF, DKIM ou DMARC de nos e-mails ;",
    "une CSRF qui ne fait que déconnecter ;",
    "le rapport d'un outil automatique, sans preuve ;",
    "une faille qui demande un téléphone déjà déverrouillé ou modifié (jailbreak, root).",
  ],
};

export const engagementsSecurite = {
  titre: "Nos engagements",
  chapo: "Tu prends le temps de nous prévenir : on joue franc-jeu avec toi.",
  engagements: [
    `**On te répond sous ${JOURS_REPONSE_SECURITE} jours**, puis on te donne des nouvelles.`,
    `**Tu peux parler de la faille** une fois corrigée, ou ${JOURS_PUBLICATION_SECURITE} jours après ton signalement si rien n'a été fait, en nous prévenant avant.`,
  ],
  promesse: PROMESSE_BONNE_FOI,
};

export const recompensesSecurite = {
  titre: "En échange d'une vraie faille",
  chapo: "La Brigade te doit une fière chandelle. Voilà ce que tu reçois :",
  recompenses: [
    { emoji: "🐞", texte: "**Le badge « Chasseur de bugs »** dans l'app. Il va au compte SOS Miam qui a la même adresse e-mail que ton signalement, si cette adresse y est confirmée." },
    { emoji: "🏆", texte: "**Ton nom au tableau d'honneur**, seulement si tu le veux (une case à cocher dans le formulaire)." },
    { emoji: "📜", texte: "**Une attestation**, pour ton CV ou pour frimer un peu." },
  ],
  prime: "**Pour certaines failles, une prime en argent est possible**, au cas par cas : pas de montant affiché, et rien de garanti.",
  premier: "**Premier arrivé, premier servi** : si deux personnes signalent la même faille, c'est le premier signalement qui compte.",
};

export const textesTableauHonneur = {
  ancre: "tableau-d-honneur",
  titre: "Le tableau d'honneur",
  chapo: "Elles et ils ont rendu SOS Miam plus sûr. Casquette bas !",
  videTitre: "La première place t'attend !",
  videTexte: "Personne n'y est encore. Trouve une vraie faille, coche la case dans le formulaire, et ton nom s'affichera ici.",
  indisponible: "Le tableau d'honneur fait une petite sieste : repasse dans un moment pour le voir.",
};

export const commentSignaler = {
  titre: "Signaler une faille",
  chapo: "Par ce formulaire, et seulement lui : ton signalement y est gardé chiffré, et seule l'équipe le lit.",
  aideTitre: "Ce qui nous aide",
  aides: [
    "**Les étapes pour reproduire**, une par une, comme une recette.",
    "**L'impact** : ce qu'un petit malin pourrait faire avec, et à qui ça ferait du tort.",
    "**Une preuve** : une requête, la réponse du serveur, une capture.",
    "**En français ou en anglais**, comme tu préfères.",
  ],
  captures: `**Tes captures** : en PNG ou en JPEG, ${IMAGES_SIGNALEMENT_MAX} au plus, ${MO_PAR_IMAGE} Mo chacune. Une vidéo ou un script ? Mets-les derrière un lien.`,
  donnees: `Ton signalement est gardé chiffré, puis effacé ${ANNEES_CONSERVATION_SECURITE} ans après sa clôture. `,
  lienDonnees: "/confidentialite#chasse-aux-bugs",
};

export const merciSignalement = {
  titre: "Merci, c'est bien arrivé !",
  texte: `On te répond sous ${JOURS_REPONSE_SECURITE} jours, à l'adresse que tu nous as donnée.`,
  secret: "D'ici là, garde la faille pour toi 🤫",
  salut: "Toute la Brigade te dit merci de veiller sur SOS Miam.",
};

export const ciblesSecurite: { valeur: CibleSignalementSecurite; libelle: string }[] = [
  { valeur: "site", libelle: "sosmiam.fr (le site)" },
  { valeur: "espaces", libelle: "ambassadeur.sosmiam.fr ou pro.sosmiam.fr (les espaces)" },
  { valeur: "api", libelle: "api.sosmiam.fr (l'API)" },
  { valeur: "app-ios", libelle: "L'app pour iPhone" },
  { valeur: "app-android", libelle: "L'app pour Android" },
];
