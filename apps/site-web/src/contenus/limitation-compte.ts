// Textes de « Ton compte est limité » (Mon compte, sur les trois hôtes) : ce que la limitation change, ce qui reste
// permis (décision de Hugo du 15 octobre 2026, docs/decisions.md, « Modération des avis et limitation d'un compte »), et
// la contestation. Les mêmes listes que les CGU (contenus/legal/cgu-moderation.ts) : à garder en phase.
// Aucun import ici : le test (tests/limitation-compte.test.ts) lance ce fichier directement avec Node. Les « {…} » se
// remplissent avec remplirModele (packages/commun/src/fonctions/texte/remplir-modele.ts).

export const textesLimitation = {
  titre: "Ton compte est limité",
  titreAVenir: "Ton compte va être limité",
  /** {fin} : « jusqu'au 22 octobre 2026 à 12 h » ou « jusqu'à nouvel ordre » */
  intro: "L'équipe SOS Miam a limité ton compte {fin}. Voici pourquoi, ce que ça change, et comment dire que tu n'es pas d'accord.",
  /** {debut} : « 17 octobre 2026 à 9 h » */
  introAVenir: "L'équipe SOS Miam va limiter ton compte à partir du {debut}, {fin}. Voici pourquoi et ce que ça changera.",
  motif: "La règle en cause",
  pourquoi: "Ce que l'équipe t'explique",
  coupeTitre: "Ce qui attend la fin",
  coupe:
    "Tout ce que les autres verraient : messages, réactions et groupes, commentaires, avis, sorties, listes, lieux envoyés à tes potes, invitations et demandes, suggestions sur la fiche d'un lieu, la fiche et la carte de ton lieu, l'arrivée dans une équipe, et un nouveau prénom, pseudo ou avatar.",
  resteTitre: "Ce qui marche comme d'habitude",
  reste:
    "Lire, valider tes visites, Miam Safe, signaler, bloquer, masquer, quitter, refuser, supprimer tes contenus, tes réglages, ce que seule l'équipe lit (proposer un lieu, candidater, demander à gérer un lieu, tes missions d'ambassadeur), « Mon compte », l'export de tes données et la suppression de ton compte.",
  contesterTitre: "Pas d'accord ?",
  contester:
    "Dis-nous pourquoi : une seule fois, tant que la limitation dure. Une autre personne de l'équipe que celle qui a décidé relit tout, et te répond dans l'app et par e-mail.",
  aideContestation: "10 à 1 000 caractères. Ce qui s'est passé, ce qui nous a peut-être échappé : simplement.",
  libelleContestation: "Pourquoi tu n'es pas d'accord",
  boutonContester: "Envoyer ma contestation",
  contestationAVenir: "Tu pourras la contester dès qu'elle commence.",
  /** {date} : le moment de l'envoi */
  contestationEnvoyee: "Ta contestation est partie le {date} :",
  contestationEnAttente: "Une autre personne de l'équipe la relit. Sa réponse arrive dans l'app et par e-mail.",
  /** {date} : le moment du réexamen ; la limitation court encore, elle est donc maintenue */
  contestationMaintenue: "Elle a été relue le {date} par une autre personne de l'équipe : la limitation est maintenue.",
  envoiReussi: "C'est envoyé ! Une autre personne de l'équipe relit ta contestation.",
  dejaConteste: "Tu as déjà contesté cette limitation : une seule contestation, et elle est bien arrivée.",
  plusDeLimitation: "Ta limitation est finie ou levée : il n'y a plus rien à contester. Bon retour parmi les Miamis !",
  texteInvalide: "Écris entre 10 et 1 000 caractères.",
};
