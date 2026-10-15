// Textes de « Ton compte est limité » dans l'app (Réglages › Décisions de la modération, et l'annonce d'une écriture refusée
// « compte-limite ») : ce que la limitation met en pause, ce qui marche toujours (décision de Hugo du 15 octobre 2026,
// docs/decisions.md, « Modération des avis et limitation d'un compte »), et la contestation. Les mêmes mots que le site
// (apps/site-web/src/contenus/limitation-compte.ts) : à garder en phase. Les « {…} » se remplissent avec remplirModele.

export const TEXTES_LIMITATION = {
  titre: "Ton compte est limité",
  titreAVenir: "Ton compte va être limité",
  titreFinie: "Ton compte était limité",
  /** {fin} : « jusqu'au 22 octobre 2026 à 12h » ou « jusqu'à nouvel ordre » */
  intro: "L'équipe SOS Miam a limité ton compte {fin}. Voici pourquoi, ce que ça change, et comment dire que tu n'es pas d'accord.",
  /** {debut} : « 17 octobre 2026 à 9h » */
  introAVenir: "L'équipe SOS Miam va limiter ton compte à partir du {debut}, {fin}. Voici pourquoi et ce que ça changera.",
  introFinie: "C'est fini ou levé : tout remarche comme d'habitude. Bon retour parmi les Miamis !",
  regle: "La règle en cause",
  /** Un code de motif que cette version de l'app ne connaît pas encore */
  regleInconnue: "Une des règles de la communauté (nos conditions d'utilisation)",
  explication: "L'explication de l'équipe",
  coupeTitre: "Ce qui attend la fin",
  coupe:
    "Tout ce que les autres verraient : messages, réactions et groupes, commentaires, avis, sorties, listes, lieux envoyés à tes potes, invitations et demandes, suggestions sur la fiche d'un lieu, la fiche et la carte de ton lieu, l'arrivée dans une équipe, et un nouveau prénom, pseudo ou avatar.",
  resteTitre: "Ce qui marche comme d'habitude",
  reste:
    "Tout lire, valider tes visites, Miam Safe, signaler, bloquer, masquer, quitter, refuser, supprimer tes contenus, tes réglages, ce que seule l'équipe lit (proposer un lieu, tes missions d'ambassadeur…), l'export de tes données et la suppression de ton compte.",
  contesterTitre: "Pas d'accord ?",
  contester: "Dis-nous pourquoi : une seule fois, tant que la limitation dure. Une autre personne de l'équipe que celle qui a décidé relit tout.",
  contestationAVenir: "Tu pourras la contester dès qu'elle commence.",
  /** {date} : le moment de l'envoi */
  contestationEnvoyee: "Ta contestation est partie le {date} :",
  contestationEnvoyeeSansDate: "Ta contestation est partie :",
  contestationEnAttente: "Une autre personne de l'équipe la relit. Sa réponse arrivera ici.",
  /** {date} : le moment du réexamen ; la limitation court encore, elle est donc maintenue */
  contestationMaintenue: "Une autre personne de l'équipe l'a relue le {date} : la limitation est maintenue.",
  /** {date} : le moment du réexamen, quand la limitation est finie ou levée */
  contestationRelue: "Une autre personne de l'équipe l'a relue le {date}.",
  /** L'annonce de toute l'app après une écriture refusée ; {fin} comme pour intro */
  annonce: "Ton compte est limité {fin} : certaines actions sont en pause.",
} as const;
