import type { DelaiReservation, ModeAcceptationReservation, RaisonReservationARevoir } from "@sos-miam/commun/types/reglages-reservations";

export const TEXTES_REGLAGES_RESERVATIONS = {
  titre: "Réglages des réservations",
  intro: "Tes règles, ton rythme : les Miamis ne voient que les horaires où tu as vraiment de la place.",
  chargement: "On ouvre ton carnet de réservations…",
  lectureEchecTitre: "Ton carnet ne s'ouvre pas",
  lectureEchecTexte: "On n'a pas pu lire tes réglages. Vérifie ta connexion, puis réessaie.",
  demoTitre: "Pas encore dans la démo",
  demoTexte: "Les réglages des réservations se testent avec un vrai compte : la démo garde ses horaires d'exemple.",
  bientotTitre: "Ça arrive très vite",
  bientotTexte: "Tes services, tes couverts et ton délai de réponse se régleront ici très bientôt. En attendant, tes réservations marchent comme avant, depuis l'onglet Réservations.",
  reessayer: "Réessayer",
  indiceReessayer: "Relit les réglages des réservations",
  gerantTitre: "C'est le gérant qui règle ça",
  gerantTexte: "Les services, les couverts et le délai, c'est le gérant. Toi, tu peux fermer ou rouvrir un jour aux résas, juste en dessous.",
  nonReservableTitre: "Les réservations sont coupées sur ta fiche",
  nonReservableTexte: "Pour l'instant, les Miamis ne peuvent pas réserver chez toi dans l'app. Prépare tout ici, puis écris-nous : on les allume avec toi.",
  nousEcrire: "Nous écrire",
  indiceNousEcrire: "Ouvre un e-mail vers bonjour@sosmiam.fr",
  modeTitre: "Comment tu réponds ?",
  modeCommun: "Dans les deux cas, un créneau complet disparaît de l'app.",
  modeAutoSansServices: "Pour accepter tout seul, règle d'abord un service : il faut savoir combien de monde tu peux accueillir.",
  servicesTitre: "Tes services",
  servicesIntro: "Un service, c'est une plage d'arrivées et ses couverts : le midi, le soir, un deuxième service…",
  repliTitre: "Pour l'instant, c'est le mode tranquille",
  repliTexte: "Tes créneaux suivent les horaires de ta fiche, un toutes les 30 min, sans limite de couverts, et tu réponds à chaque demande.",
  repliBouton: "Régler mes services",
  repliAide: "On part de tes horaires actuels : tu n'as plus qu'à ajuster.",
  repliSansHoraires: "Ta fiche n'a pas encore d'horaires, alors personne ne peut réserver. Crée ton premier service : on te guide.",
  repliCouverts: "Combien de couverts sur un service ?",
  repliCouvertsAide: "Toutes tes tables, pour un service. On n'en vendra jamais plus : tu pourras ajuster service par service.",
  repliCouvertsErreur: "Indique tes couverts, même à la louche : 40, par exemple.",
  couvertsExemple: "40",
  ajouterService: "Ajouter un service",
  ajouterServiceIndice: "Ouvre un nouveau service à régler",
  servicesMax: "12 services au plus : ça fait déjà une sacrée semaine !",
  revenirRepli: "Revenir aux horaires de ma fiche",
  delaiTitre: "Délai minimum",
  delaiIntro: "Le temps qu'il te faut pour te retourner avant une arrivée.",
  delaiCourtALaMain: "À la main avec 30 min, une demande s'endort 10 min avant l'horaire : garde un œil sur ton téléphone.",
  joursFermesTitre: "Jours sans résa",
  joursFermesIntro: "Congés, privatisation, soir complet… Ces jours-là, l'app ne propose aucun créneau. Ça part tout de suite, sans « Enregistrer ».",
  joursFermesVide: "Aucun pour l'instant.",
  joursFermesProchains: "Les prochains jours sans résa",
  choisirJoursFermes: "Choisir des jours",
  indiceChoisirJoursFermes: "Ouvre le calendrier des trois prochains mois",
  rouvrirJourIndice: "Touche pour rouvrir les résas ce jour-là",
  jourFermeLu: "{jour}, sans résa",
  enregistrer: "Enregistrer",
  enregistrement: "Enregistrement…",
  rienAEnregistrer: "Rien n'a changé pour l'instant",
  indiceEnregistrer: "Envoie tes réglages : les Miamis les voient tout de suite",
  pasEncoreEnregistre: "Des changements pas encore enregistrés",
  toutAnnuler: "Tout annuler",
  indiceToutAnnuler: "Revient aux réglages enregistrés",
  enregistre: "✅ C'est réglé ! Les Miamis voient déjà tes nouveaux horaires.",
  echecEnregistrement: "Ça n'a pas pu partir. Vérifie ta connexion et réessaie : tes réglages t'attendent ici.",
  aRevoirTitre: "À revoir ({nombre})",
  aRevoirTexte: "Ces tables ne collent plus à tes réglages. Rien n'est annulé : jette un œil dans l'onglet Réservations.",
  aRevoirBouton: "Voir les réservations",
  repasseALaMain: "Sans service, on repasse en réponse à la main.",
  annonceJourFerme: "🛑 Plus de résa le {jour}",
  annonceJourRouvert: "✅ Les résas sont rouvertes le {jour}",
  aCorriger: "À revoir : {erreur}",
} as const;

export const MODES_ACCEPTATION: Readonly<
  Record<ModeAcceptationReservation, { emoji: string; titre: string; texte: string; court: string; etiquette: string; etiquetteLue: string }>
> = {
  automatique: {
    emoji: "⚡",
    titre: "J'accepte tout seul",
    texte: "Tant qu'il reste de la place, c'est confirmé direct. Toi, tu cuisines.",
    court: "acceptation auto",
    etiquette: "⚡ Acceptation auto",
    etiquetteLue: "Acceptation automatique",
  },
  manuelle: {
    emoji: "✋",
    titre: "Je réponds à la main",
    texte: "Chaque demande t'attend dans l'onglet Réservations : tu acceptes ou tu refuses.",
    court: "réponse à la main",
    etiquette: "✋ Réponse à la main",
    etiquetteLue: "Réponse à la main",
  },
};

export const DELAIS_RESERVATION_TEXTES: Readonly<Record<DelaiReservation, { libelle: string; court: string; phrase: string }>> = {
  "30-min": { libelle: "30 min", court: "30 min", phrase: "On peut réserver jusqu'à 30 min avant d'arriver." },
  "1-h": { libelle: "1 h", court: "1 h", phrase: "On peut réserver jusqu'à 1 h avant d'arriver." },
  "2-h": { libelle: "2 h", court: "2 h", phrase: "On peut réserver jusqu'à 2 h avant d'arriver." },
  veille: { libelle: "La veille", court: "la veille", phrase: "Pas de résa pour le jour même : on réserve au plus tard la veille, avant minuit." },
};

export const TEXTES_FEUILLE_SERVICE = {
  titreNouveau: "Nouveau service",
  jours: "Quels jours ?",
  joursAide: "Un jour sans service, c'est un jour sans résa (même si tu es ouvert).",
  premier: "Première arrivée",
  dernier: "Dernière arrivée",
  dernierAide: "La dernière table que tu acceptes d'installer.",
  heure: "Heure",
  minutes: "Minutes",
  changerHeureIndice: "Touche pour choisir l'heure",
  heureChoisie: "{champ} : {heure}",
  pas: "Un créneau toutes les…",
  pasLibelle: "{minutes} min",
  heuresAjustees: "Heures ajustées : {premier} → {dernier}",
  couvertsService: "Combien de couverts sur ce service ?",
  couvertsServiceLu: "Couverts sur ce service",
  couvertsServiceAide: "Toutes les tables du service : on n'en vendra jamais plus. 40 couverts ? On s'arrête à 40.",
  arrivees: "Arrivées par créneau",
  arriveesMention: "réglage fin, facultatif",
  arriveesLu: "Arrivées par créneau",
  arriveesAide: "Pré-rempli avec les couverts du service. Baisse-le si la cuisine panique quand tout le monde arrive à la même heure.",
  arriveesOuvrir: "Régler les arrivées par créneau",
  arriveesOuvrirIndice: "Limite le nombre de personnes qui arrivent à la même heure",
  arriveesFermer: "Comme les couverts du service",
  arriveesFermerIndice: "Remet les arrivées par créneau au nombre de couverts du service",
  apercu: "Les Miamis verront :",
  apercuVide: "Aucun créneau avec ces heures-là.",
  apercuCouverts: "Jusqu'à {couverts} sur ce service.",
  garder: "Garder ce service",
  supprimer: "Supprimer ce service",
  annuler: "Annuler",
} as const;

export const ERREURS_SERVICE = {
  jours: "Choisis au moins un jour, même un seul.",
  premier: "Une première arrivée au quart d'heure près, s'il te plaît.",
  dernier: "La dernière arrivée vient après la première, pile sur un créneau, et avant minuit.",
  pas: "Un créneau toutes les 15 ou 30 min.",
  couvertsParService: "Entre 1 et 3 000 couverts sur le service.",
  couvertsParCreneau: "Pas plus d'arrivées par créneau que de couverts sur le service.",
  chevauchement: "Ce service chevauche {service} le {jour} : décale l'un des deux.",
  acceptation: "Pour accepter tout seul, il faut au moins un service.",
  delai: "Choisis un délai minimum.",
  services: "12 services au plus : ça fait déjà une sacrée semaine !",
  autre: "Un réglage coince : jette un œil à tes services.",
} as const;

export const TEXTES_FEUILLE_JOURS_FERMES = {
  titre: "Quels jours sans résa ?",
  sousTitre: "Touche un jour pour le fermer aux résas, touche-le encore pour le rouvrir. Ça part tout de suite.",
  jourLuFerme: "{jour}, sans résa",
  indice: "Touche pour fermer ou rouvrir les résas ce jour-là",
  fermer: "C'est bon",
  joursMax: "120 jours sans résa au plus : il faut bien rouvrir un jour !",
} as const;

export const AVERTISSEMENTS_REGLAGES: Readonly<Record<RaisonReservationARevoir, { emoji: string; texte: string }>> = {
  "jour-ferme": { emoji: "🛑", texte: "{quand} : {quoi} ({personnes}) tombe un jour sans résa." },
  "hors-service": { emoji: "🕰️", texte: "{quand} : {quoi} ({personnes}) tombe en dehors de tes services." },
  capacite: { emoji: "🪑", texte: "{quand} : avec {quoi} ({personnes}), ça déborde de tes couverts." },
};

export const TEXTES_AVERTISSEMENTS_REGLAGES = {
  table: "la table de {nom}",
  demande: "la demande de {nom}",
  demandesUn: "Une demande t'attend encore : réponds-y à la main, les nouvelles s'accepteront toutes seules.",
  demandesPlusieurs: "{nombre} demandes t'attendent encore : réponds-y à la main, les nouvelles s'accepteront toutes seules.",
  note: "Rien n'est annulé tout seul : tes clients gardent leur table. Si tu ne peux pas les accueillir, annule-les depuis l'onglet Réservations : ils seront prévenus.",
} as const;

export const CONFIRMATIONS_REGLAGES_RESERVATIONS = {
  partir: {
    titre: "Partir sans enregistrer ?",
    detail: "Tes changements seront perdus. Les Miamis verront toujours tes anciens réglages.",
    confirmer: "Partir sans enregistrer",
    rester: "Rester",
    indiceRester: "Tu restes sur tes réglages, rien n'est perdu",
  },
  revenirRepli: {
    titre: "Retour au mode tranquille ?",
    detail: "Les créneaux suivront tes horaires d'ouverture, toutes les 30 min, sans limite de couverts, et tu répondras à chaque demande. Les tables déjà prises ne bougent pas.",
    confirmer: "Revenir aux horaires",
    rester: "Garder mes services",
  },
  avertissements: {
    titre: "Avant d'enregistrer",
    confirmer: "Enregistrer quand même",
    rester: "Je revois",
  },
} as const;

export const TEXTES_RESUME_REGLAGES = {
  inconnu: "Tes services, tes couverts, ton délai et tes jours sans résa",
  nonReservable: "Coupées sur ta fiche pour l'instant : prépare tout ici",
  tranquille: "Mode tranquille : tes horaires, un créneau toutes les 30 min · délai {delai}",
  services: "{services} · {mode} · délai {delai}",
  joursFermes: { un: "1 jour sans résa", plusieurs: "{nombre} jours sans résa" },
} as const;

export const TEXTES_CARTE_SERVICE = {
  plage: "{premier} → {dernier}",
  rythme: "toutes les {pas} min, {nombre} créneaux",
  unCreneau: "1 seul créneau",
  couverts: "{couverts} sur le service",
  arrivees: "{arrivees} arrivées par créneau au plus",
  lu: "{titre}. {jours}. Arrivées de {premier} à {dernier}, {rythme}. {capacite}.",
  luUnCreneau: "{titre}. {jours}. Arrivée à {premier}. {capacite}.",
  modifierIndice: "Ouvre ce service pour le modifier",
  voirIndice: "C'est le gérant qui modifie les services",
} as const;
