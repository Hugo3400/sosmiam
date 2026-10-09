// Conditions d'utilisation, section « L'espace pro », reprise par cgu.ts. Son id « pro » ne doit pas changer : la case à
// cocher de /inscription sur pro.sosmiam.fr y renvoie (https://sosmiam.fr/cgu#pro).
// Décisions : docs/decisions.md, « Espace pro » (rattachement validé par l'équipe, nom et adresse par l'équipe, tout
// gratuit) et « Compte unique ». Données : confidentialite-compte-pro.ts.
import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienEspacePro = `[${HOTE_PRO}](https://${HOTE_PRO})`;

export const sectionProCgu: SectionLegale = {
  id: "pro",
  titre: "L'espace pro",
  blocs: [
    `Sur ${lienEspacePro}, les lieux tiennent leur fiche SOS Miam à jour : horaires, texte, contact, infos pratiques, équipe et affichette de table. Tu y entres avec ton compte SOS Miam, **dès 18 ans**. En créant ce compte, tu acceptes ces conditions, et en particulier les règles ci-dessous.`,
    {
      liste: [
        "**C'est gratuit**, pour toujours : pas d'abonnement, pas de commission, rien à payer pour avoir sa fiche, la tenir à jour ou être « Vérifié ✓ ». Et aucun lieu ne peut payer pour être mieux placé (voir « Ce que tu trouves sur SOS Miam »).",
        "**Tu représentes vraiment le lieu.** Tu demandes à gérer un lieu seulement si tu en es le gérant, le patron ou la personne qu'il a chargée de sa fiche, et tu nous dis pourquoi (la « preuve » ; le numéro SIRET est facultatif). Un membre de l'équipe du lieu, lui, y entre sur invitation d'un gérant.",
        "**L'équipe de SOS Miam décide**, à la main. Elle peut refuser une demande, ou retirer plus tard un rattachement (par exemple si le lieu change de mains, si la preuve se révèle fausse ou si ces règles ne sont pas suivies)  : tu vois sa décision, et sa réponse s'il y en a une, dans ton tableau, et tu peux nous écrire pour en savoir plus ou si tu n'es pas d'accord. Tant que ta demande n'est pas validée, tu ne modifies pas la fiche.",
        "**Les infos que tu publies doivent être exactes** : horaires, texte, contact, infos pratiques. Elles s'affichent tout de suite sur la fiche publique, et les clients s'y fient pour venir. Si quelque chose change (fermeture, nouveaux horaires), tu mets la fiche à jour. Les [règles de la communauté](#regles-communaute) s'appliquent aussi à tout ce que tu écris.",
        "**Le nom et l'adresse passent par l'équipe** : tu peux les proposer depuis ta fiche, mais ils ne changent qu'une fois acceptés par l'équipe. C'est ce qui protège un lieu contre quelqu'un qui voudrait changer son nom ou son adresse à sa place.",
        "**Pas de fausse identité** : tu ne te fais pas passer pour un lieu que tu ne représentes pas, ni pour quelqu'un d'autre, et tu n'invites dans ton équipe que des personnes qui travaillent vraiment avec toi. Un gérant est responsable des invitations qu'il envoie, et peut retirer un membre à tout moment.",
        "**Les suggestions des clients** sur ta fiche te sont montrées sans le nom de leur auteur : c'est l'équipe de SOS Miam qui les accepte ou non. Tu ne cherches pas à savoir qui les a écrites, et tu ne t'en prends jamais à un client pour une suggestion.",
        `**Tu peux partir quand tu veux** : quitter un lieu depuis ton tableau, ou supprimer ton compte dans « Mon compte » (ton mot de passe t'est demandé). La fiche du lieu, elle, reste sur SOS Miam : pour la retirer, écris-nous à ${lienContact}. Ce qu'on garde, et combien de temps, est détaillé dans la [politique de confidentialité](/confidentialite#compte-pro).`,
        `**En cas d'abus** (fausse identité, fausses infos sur une fiche, invitations à des inconnus, propos blessants…), l'équipe peut retirer le rattachement et, dans les cas graves, supprimer le compte. Si tu penses qu'il y a une erreur, écris-nous à ${lienContact}.`,
      ],
    },
  ],
};
