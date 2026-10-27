export const TEXTES_FOND = {
  barre: { infobulle: "SOS Miam Gestion : veille sur ce qui attend", ouvrir: "Ouvrir SOS Miam Gestion", quitter: "Quitter (plus de notifications)" },
  carte: {
    titre: "Notifications avec le logiciel fermé",
    case: "Rester près de l'horloge et démarrer avec Windows",
    aide: "Fermer la fenêtre ne quitte plus le logiciel : il reste en petite icône près de l'horloge et te prévient de tout ce qui attend, même verrouillé. Pour vraiment le quitter : clic droit sur l'icône, « Quitter ».",
    securite: "Logiciel verrouillé, il ne lit que des nombres (combien de signalements, d'avis, de mails…) avec un jeton propre à ce PC : jamais un nom ni un contenu. Le jeton ne marche plus si ce PC est retiré.",
    passage: "Pas sur un PC de passage : le logiciel se ferme vraiment, et rien ne démarre avec Windows.",
    navigateur: "Seulement dans le logiciel installé sur Windows.",
    actif: "Activé : tu seras prévenu même fenêtre fermée.",
    enAttente: "Activé : le jeton de ce PC arrive à ta prochaine connexion.",
  },
  erreurJeton: "Le jeton des notifications n'a pas pu être créé : on réessaie à la prochaine connexion.",
} as const;
