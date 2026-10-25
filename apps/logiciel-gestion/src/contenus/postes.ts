export const ADRESSE_TELECHARGEMENT = "https://sosmiam.fr/api-gestion/telecharger";

export const DUREES_POSTE = [
  { valeur: "passage", libelle: "Aujourd'hui (12 h)" },
  { valeur: "semaine", libelle: "7 jours" },
  { valeur: "toujours", libelle: "Toujours, c'est mon PC" },
] as const;

export type DureePoste = (typeof DUREES_POSTE)[number]["valeur"];

export const TEXTES_AUTORISATION = {
  titre: "Autorise ce PC",
  sousTitre: "Dernière étape. Le serveur ne connaîtra que la clé publique de ce PC : elle sert à vérifier tes demandes, pas à en fabriquer.",
  coupe: "Ce PC n'est plus autorisé : sa durée est finie, ou il a été coupé. Autorise-le à nouveau, ou efface-le s'il n'est pas à toi.",
  modes: [
    { valeur: "distance", libelle: "Ici, tout de suite" },
    { valeur: "serveur", libelle: "Par le serveur" },
  ],
  distance: {
    intro: "Depuis n'importe quel PC Windows, avec ton mot de passe de gestion et ton code à 6 chiffres. Un mail te prévient à chaque nouveau PC.",
    nom: "Nom de ce PC",
    nomParDefaut: "PC de passage",
    aideNom: "Pour le reconnaître dans la liste : « PC du bureau », « PC de Léa »…",
    duree: "Combien de temps ?",
    aideDuree: "Sur un PC qui n'est pas à toi, garde « Aujourd'hui » : il se coupe tout seul.",
    motDePasse: "Mot de passe de gestion",
    aideMotDePasse: "Celui choisi sur le serveur (npm run gestion:autoriser -- --distance), pas celui de ce PC.",
    code: "Code à 6 chiffres",
    aideCode: "Celui de ton application d'authentification, compte « SOS Miam Gestion ».",
    bouton: "Autoriser ce PC et entrer",
  },
  serveur: {
    etape1: "Ouvre un terminal sur le serveur, toi-même (pas à travers Claude : un secret peut s'afficher), dans /var/www/sos-miam, et lance :",
    etape2: "Vérifie que le serveur affiche bien l'identifiant",
    etape3: "La première fois, il affiche aussi une clé de configuration : ajoute-la dans ton application d'authentification (Google Authenticator, Microsoft Authenticator…). C'est elle qui te donnera le code à 6 chiffres.",
    nomParDefaut: "PC de Hugo",
    copier: "Copier la commande",
    bouton: "C'est fait, je me connecte",
  },
  effacer: "Effacer ce PC",
  confirmerEffacer: "Effacer la clé de ce PC ? Il faudra en recréer une pour revenir.",
} as const;

export const TEXTES_PASSAGE = {
  bandeau: (jusquA: string) => `PC de passage : autorisé jusqu'au ${jusquA}, puis coupé tout seul.`,
  partir: "Partir et tout effacer",
  titreConfirmation: "Partir et tout effacer ?",
  confirmation: "Ce PC est coupé sur le serveur, et sa clé est effacée d'ici. Pour revenir, il faudra l'autoriser à nouveau.",
  confirmer: "Oui, je pars",
  annuler: "Je reste",
  expire: (le: string) => `Ce PC de passage n'est plus autorisé depuis le ${le}. Tape le mot de passe de ce PC pour l'autoriser à nouveau, ou efface-le.`,
} as const;

export const TEXTES_POSTES = {
  titre: "PC autorisés",
  sousTitre: "Les ordinateurs qui peuvent ouvrir le logiciel. Un PC coupé est refusé à la seconde, et pour de bon : pour qu'il revienne, il faut recréer sa clé.",
  distanceOuverte: "Ajout de PC à distance : ouvert",
  distanceAvecMail: "Un mail part à chaque nouveau PC.",
  distanceSansMail: "Aucun mail d'alerte n'est réglé : relance la commande ci-dessous pour en mettre un.",
  distanceFermee: "Ajout de PC à distance : fermé",
  aideFermee: "Pour pouvoir autoriser un PC depuis n'importe où, lance sur le serveur, toi-même :",
  commandeDistance: "npm run gestion:autoriser -- --distance",
  installer: "Installer le logiciel sur un autre PC",
  aideInstaller: "Ouvre cette adresse sur le PC, installe, puis choisis « Ici, tout de suite ».",
  copier: "Copier l'adresse",
  cePoste: "Ce PC",
  serveur: "Ajouté par le serveur",
  distance: "Ajouté à distance",
  ajouteLe: (le: string) => `Ajouté le ${le}`,
  jusquA: (le: string) => `jusqu'au ${le}`,
  sansFin: "sans date de fin",
  couper: "Couper",
  titreCouper: (nom: string) => `Couper « ${nom} » ?`,
  confirmationCouper: "Il est refusé tout de suite, même au milieu d'une action. Pour qu'il revienne, il faudra recréer sa clé et l'autoriser à nouveau.",
  confirmer: "Couper ce PC",
  annuler: "Annuler",
  coupe: (nom: string) => `« ${nom} » est coupé.`,
  pasBranche: "Pas encore branché sur le serveur : cet écran marchera après le prochain redémarrage de l'API.",
} as const;
