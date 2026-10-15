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
   * Exactement ce que l'API refuse (apps/api/tests/limitation-inventaire-routes.test.ts : ECRITURES_REFUSEES pour la partie
   * sociale, ECRITURES_REFUSEES_HORS_SOCIAL pour les avis et le comptoir, ECRITURES_CONDITIONNELLES_HORS_SOCIAL pour ce qui
   * n'est refusé que dans certains cas), plus les suggestions et l'entrée dans une équipe (routes/comptes.ts), le prénom, le
   * pseudo et l'avatar (controleurs/comptes-profil.ts), la fiche, la carte et l'invitation dans l'équipe (routes/pro.ts).
   * Les trois cas tranchés par la session App le 15/10 (docs/decisions.md) : le petit mot d'une réservation, ce qui est à
   * un collègue (son SOS, son événement) et le message du moment (il est au lieu, pas à son auteur) sont refusés ; éteindre
   * la carte de fidélité sans rien y changer passe.
   */
  coupe:
    "Tout ce que les autres verraient : messages (photos et notes vocales comprises) et réactions, groupes (créer, renommer, inviter, changer les admins), commentaires (écrire, modifier), avis (vérifiés ou non), sorties (créer, inviter, proposer un lieu), listes (créer, modifier, ajouter une adresse, inviter quelqu'un à la remplir), lieux envoyés à tes potes, rejoindre une bande ou demander à y entrer, suivre quelqu'un, suggestions sur la fiche d'un lieu, un nouveau prénom, pseudo ou avatar, et le petit mot d'une demande de réservation. En mode pro, publier pour ton lieu : sa fiche, sa carte, le SOS du soir, le message du moment (l'afficher comme l'effacer), les événements (publier, modifier) et les réponses aux avis ; créer, rallumer ou modifier sa carte de fidélité ; arrêter le SOS ou annuler l'événement d'un collègue ; inviter dans ton équipe ou y entrer.",
  resteTitre: "Ce qui marche comme d'habitude",
  /** Ce que l'API laisse passer (ECRITURES_PERMISES et ECRITURES_PERMISES_HORS_SOCIAL du même test), dit simplement */
  reste:
    "Tout lire, valider tes visites, réserver une table (sans petit mot), Miam Safe, voter dans une sortie, mettre un J'aime à un commentaire, accepter ou refuser une invitation ou une demande, suivre une liste, signaler, bloquer, masquer, quitter, retirer quelqu'un de ta sortie ou de ton groupe, supprimer tes contenus, tes réglages, ce que seule l'équipe lit (proposer un lieu, demander à gérer un lieu, tes missions d'ambassadeur…), l'export de tes données et la suppression de ton compte. En mode pro : le comptoir de ton lieu (valider les visites, répondre aux réservations), arrêter ton propre SOS, annuler tes propres événements et éteindre la carte de fidélité telle quelle.",
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
  /** Sous une bulle qui n'est pas partie, suivi de « Voir pourquoi » (pas de « Réessaie » : touchée, elle ouvre le pourquoi) */
  bulle: "Pas parti : ton compte est limité.",
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
  /** Éteindre la carte sans rien y changer passe toujours (choix de la session App du 15/10/2026) */
  fidelite: "Ton compte est limité : créer, rallumer ou modifier la carte de fidélité attendra la fin de la limitation. L'éteindre telle quelle, tu peux toujours.",
  sosDuSoir: "Ton compte est limité : lancer le SOS du soir attendra la fin de la limitation.",
  /** Le SOS d'un collègue est aux autres ; le sien s'arrête toujours (choix de la session App du 15/10/2026) */
  arreterSos: "Ton compte est limité : arrêter le SOS d'un collègue attendra la fin de la limitation. Le tien, tu peux toujours l'arrêter.",
  messageMoment: "Ton compte est limité : afficher un message du moment attendra la fin de la limitation.",
  /** Le message du moment ne garde pas son auteur : il est au lieu, donc aux autres (choix de la session App du 15/10/2026) */
  effacerMessage: "Ton compte est limité : effacer le message du moment attendra la fin de la limitation.",
  evenement: "Ton compte est limité : publier ou modifier un événement attendra la fin de la limitation.",
  /** L'événement d'un collègue est aux autres ; les siens s'annulent toujours (choix de la session App du 15/10/2026) */
  annulerEvenement: "Ton compte est limité : annuler l'événement d'un collègue attendra la fin de la limitation. Les tiens, tu peux toujours les annuler.",
  // Prêts pour l'écran d'avis et les réponses du mode pro, pas encore dans l'app (avis/[visiteId] est provisoire)
  avis: "Ton compte est limité : les avis (vérifiés ou non) sont en pause pour l'instant.",
  reponseAvis: "Ton compte est limité : répondre aux avis attendra la fin de la limitation.",
  // Prêt pour l'écran de réservation (lieu/[id]/reserver est provisoire) : le petit mot est un texte libre que lit le lieu,
  // refusé à un compte limité ; sans mot, la demande passe comme d'habitude (choix de la session App du 15/10/2026)
  petitMot: "Ton compte est limité : le petit mot au lieu attendra la fin de la limitation. Envoie ta demande sans petit mot, elle part comme d'habitude.",
} as const;

/** Sous une bulle qui n'est pas partie (PauseMessageLimite) : de quoi voir pourquoi, et la retirer du téléphone */
export const BULLE_EN_PAUSE = {
  voirPourquoi: "Voir pourquoi",
  indiceVoirPourquoi: "Ouvre les décisions de la modération",
  retirer: "Retirer",
  retirerLu: "Retirer ce message",
  indiceRetirer: "Il n'est jamais parti : il disparaît de ton téléphone",
  retire: "Message retiré.",
} as const;

/** Le haut d'un refus montré en carte (emoji, titre, puis la phrase du geste de REFUS_LIMITATION) */
export const CARTE_REFUS_LIMITATION = {
  emoji: "⏸️",
  /** Pour un écran qui n'a pas la date de fin (le titre partagé, « Compte limité jusqu'au {date} », l'attend) */
  titre: "Compte limité pour l'instant",
  /** Après un scan ou un lien collé pour rejoindre une bande : la phrase dessous dit déjà que le compte est limité */
  titreAjout: "Pas cette fois",
} as const;
