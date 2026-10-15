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
  /**
   * Exactement ce que l'API refuse (ECRITURES_REFUSEES de apps/api/tests/limitation-inventaire-routes.test.ts, plus les
   * suggestions, la fiche, la carte et l'équipe d'un lieu, le prénom, le pseudo et l'avatar). Pas les avis : leurs routes ne
   * sont pas encore branchées (A_BRANCHER_PLUS_TARD) ; ils reviendront ici avec elles.
   */
  coupe:
    "Tout ce que les autres verraient : messages (photos et notes vocales comprises) et réactions, groupes (créer, renommer, inviter, changer les admins), commentaires, sorties (créer, inviter, proposer un lieu), listes (créer, modifier, ajouter une adresse, inviter quelqu'un à la remplir), lieux envoyés à tes potes, rejoindre une bande ou demander à y entrer, suivre quelqu'un, suggestions sur la fiche d'un lieu, la fiche et la carte de ton lieu, inviter dans ton équipe ou y entrer, et un nouveau prénom, pseudo ou avatar.",
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

/**
 * Un geste refusé « compte-limite », dit sur place par l'écran qui montre déjà ses erreurs (l'annonce de toute l'app, avec
 * « Voir pourquoi », s'y ajoute). Jamais une panne de réseau, jamais « Réessaie » : la limitation dure ce qu'elle dure.
 */
export const REFUS_LIMITATION = {
  commentaire: "Ton compte est limité : les commentaires sont en pause pour l'instant.",
  message: "Ton compte est limité : les messages sont en pause pour l'instant.",
  /** Sous une bulle qui n'est pas partie (ni « Réessaie » : touchée, elle ouvre le pourquoi) */
  bulle: "En pause : ton compte est limité. Voir pourquoi",
  groupe: "Ton compte est limité : créer un groupe attendra la fin de la limitation.",
  lieuEnvoye: "Ton compte est limité : envoyer un lieu à tes potes attendra la fin de la limitation.",
  liste: "Ton compte est limité : créer ou modifier une liste attendra la fin de la limitation.",
  lieuListe: "Ton compte est limité : ajouter une adresse à une liste attendra la fin de la limitation.",
  coAuteur: "Ton compte est limité : inviter quelqu'un à remplir ta liste attendra la fin de la limitation.",
  sortie: "Ton compte est limité : les sorties (créer, inviter, proposer un lieu) sont en pause pour l'instant.",
  bande: "Ton compte est limité : rejoindre une bande ou demander à y entrer attendra la fin de la limitation.",
  suivre: "Ton compte est limité : suivre quelqu'un attendra la fin de la limitation.",
  suggestion: "Ton compte est limité : les suggestions sur la fiche d'un lieu sont en pause pour l'instant.",
  ficheLieu: "Ton compte est limité : la fiche et la carte de ton lieu attendront la fin de la limitation.",
} as const;
