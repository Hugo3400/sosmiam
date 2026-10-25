import type { CategorieLieu } from "~/types/lieux";

export const TEXTES_FICHE_LIEU = {
  meta: {
    titre: (nom: string, ville: string) => `${nom} à ${ville}`,
    description: (nom: string, ville: string) => `${nom}, à ${ville}, sur SOS Miam.`,
    introuvable: "Lieu introuvable — SOS Miam",
    indisponible: "Fiche momentanément indisponible",
  },
  filAriane: {
    etiquette: "Fil d'Ariane",
    accueil: "Accueil",
  },
  badge: {
    verifie: "✓ Vérifié",
    nonVerifie: "Non vérifié",
    detailVerifie: "Ce lieu a un compte SOS Miam : c'est lui qui tient sa fiche.",
    detailNonVerifie: "Il n'a pas encore de compte SOS Miam.",
  },
  nonVerifie: (source: string | null) =>
    `Lieu non vérifié : il n'a pas encore de compte SOS Miam. Ses infos viennent ${source ? `de ${source}` : "de l'équipe ou d'un ambassadeur"}.`,
  denichePar: (prenom: string) => `Déniché par ${prenom}`,
  ouverture: {
    ouvert: (heure: string) => `Ouvert · ferme à ${heure}`,
    ouvertSansArret: "Ouvert 24 h/24",
    minuit: "minuit",
    fermeAujourdhui: (heure: string) => `Fermé · ouvre à ${heure}`,
    fermeDemain: (heure: string) => `Fermé · ouvre demain à ${heure}`,
    fermeJour: (jour: string, heure: string) => `Fermé · ouvre ${jour} à ${heure}`,
  },
  actions: {
    etiquette: "Actions sur ce lieu",
    itineraire: "Itinéraire",
    vers: (nom: string) => ` vers ${nom}`,
    appeler: "Appeler",
    appelerLe: (numero: string) => ` le ${numero}`,
    reserverDansApp: "Réserver dans l'app",
    appelerPourReserver: "Appeler pour réserver",
    siteWeb: "Site web",
    instagram: "Instagram",
    partager: "Partager",
    copie: "Lien copié !",
    lienCopie: "Lien copié : à toi de le glisser à tes potes !",
    copieImpossible: "Le lien ne s'est pas copié : prends l'adresse de la page.",
    ouvrirApp: "Ouvrir l'app",
  },
  etiquettes: "Ce qu'en disent les Miamis",
  sos: {
    surtitre: "SOS ce soir",
    places: (nombre: number, heure: string | null) =>
      `${nombre} ${nombre > 1 ? "places libres" : "place libre"}${heure ? ` jusqu'à ${heure}` : " ce soir"}`,
    bouton: "Ouvre l'app pour y aller",
  },
  lieu: {
    titre: { resto: "Le lieu", patisserie: "Le lieu", bar: "Le lieu", sortie: "L'activité" } satisfies Record<CategorieLieu, string>,
    specialite: "La spécialité : ",
  },
  specialites: "Les spécialités",
  ambiance: {
    titre: "L'ambiance",
    note: "Des étiquettes données par les Miamis dans l'app, sur l'ambiance et ce qu'on y mange, jamais sur l'alcool.",
  },
  commentReserver: {
    titre: "Comment réserver",
    texte: "Sur son site, par téléphone ou sur place : le lieu te dit comment il préfère.",
    site: "Réserver sur son site",
    telephone: "Réserver par téléphone",
  },
  carte: {
    titre: { carte: "La carte", formules: "Les formules" },
    rubriques: "Rubriques de la carte",
    majLe: (date: string) => `Mise à jour par le lieu le ${date}`,
    voirTout: "Voir toute la carte",
  },
  bonASavoir: {
    titre: "Bon à savoir",
    paiement: (liste: string) => `Paiement : ${liste}`,
  },
  horaires: "Horaires",
  ouCest: {
    titre: "Où c'est",
    itineraire: "Itinéraire",
    agrandir: "Agrandir la carte",
  },
  app: {
    titre: "Dans l'app SOS Miam",
    texte: "Garde ce lieu en favori, reçois ses SOS et gagne des points à chaque visite validée.",
    bouton: "Ouvrir dans l'app",
    bientot: "Pas encore l'app ? Elle arrive bientôt sur les stores.",
  },
  tonLieu: {
    titre: { resto: "C'est ton resto ?", patisserie: "C'est ta pâtisserie ?", bar: "C'est ton bar ?", sortie: "C'est ton activité ?" } satisfies Record<CategorieLieu, string>,
    texteNonVerifie:
      "Prends la main sur ta fiche : ta présentation, tes horaires, ta carte, et des SOS les soirs calmes. Ton lieu gagne le badge Vérifié ✓. C'est gratuit, sans abonnement ni commission.",
    texteVerifie: "Tu fais partie de l'équipe ? Rejoins l'espace pro pour tenir la fiche avec les autres. C'est gratuit.",
    boutonNonVerifie: "Réclamer ma fiche",
    boutonVerifie: "Rejoindre l'espace pro",
  },
  signaler: {
    lien: "Une info fausse ? Signale-la",
    objet: (nom: string, id: number) => `Une info fausse sur la fiche de ${nom} (n° ${id})`,
    texte: (adresse: string) => `Salut l'équipe SOS Miam !\n\nSur la fiche ${adresse}, cette info n'est pas juste : \n\nLa bonne info : \n`,
    image: "Signaler une image",
  },
  autour: {
    titre: "Autour de ce lieu",
    titreSortie: "Et pour manger après ?",
    sos: "SOS ce soir",
  },
  barreMobile: "Actions rapides",
  source: {
    debut: "Texte et infos : ",
    licence: ", sous ",
  },
  prevention: {
    etiquette: "Prévention",
    besoin: "Besoin d'en parler ? ",
    anonyme: " (appel anonyme et non surtaxé) ou ",
    page: "Santé et prévention",
  },
} as const;
