// Connexion par QR code, « comme Discord » (décidé le 14 octobre 2026, docs/decisions.md) : l'app déjà connectée scanne le
// QR d'un ordinateur (site) ou d'un nouveau téléphone, puis confirme (écran, puis Face ID, l'empreinte ou le code du
// téléphone). Contrat de l'API : session Site (routes /comptes/qr et /app/qr).

/** Un QR vit 2 minutes, et sert une seule fois */
export const DUREE_QR_CONNEXION_S = 120;
/** Après le scan, on a 60 secondes pour accepter (et jamais après la fin du QR : c'est l'API qui tranche) */
export const DELAI_ACCEPTATION_QR_S = 60;
/** L'appareil qui montre le QR demande où ça en est toutes les 2 secondes, une demande à la fois (pas de WebSocket) */
export const INTERVALLE_ATTENTE_QR_MS = 2000;
/** Autant d'échecs d'affilée en attendant (pas de réseau, API en panne) : on le dit, au lieu d'attendre en silence */
export const ECHECS_ATTENTE_QR_MAX = 3;
/** Un QR fini sur ce téléphone sans que l'API l'ait dit (réseau coupé) : on en redemande un après cette marge */
export const MARGE_FIN_QR_MS = 5000;

export const textesConnexionQr = {
  // Téléphone déjà connecté : scanner, puis confirmer
  titreScanner: "Connecter un appareil",
  sousTitreScanner: "Ton ordinateur ou un nouveau téléphone, sans retaper ton mot de passe.",
  etapesScanner: [
    "Sur l'appareil à connecter, choisis « Me connecter avec l'app » sur sosmiam.fr, ou « Me connecter avec un QR code » dans l'app.",
    "Vise le QR code avec ce téléphone.",
    "Vérifie bien où ça se connecte, puis confirme avec Face ID, ton empreinte ou ton code.",
  ],
  pasUnQr: "Ce QR code ne sert pas à connecter un appareil. Vise celui de « Me connecter avec l'app » sur sosmiam.fr, ou de « Me connecter avec un QR code » dans l'app.",
  // Un lien sosmiam.fr/q/… ouvert dans l'app : l'appareil photo du téléphone… ou un escroc qui l'a envoyé par message
  titreLien: "Tu viens d'ouvrir un lien de connexion",
  texteLien:
    "Il sert à connecter un autre appareil à TON compte. Tu viens de viser un QR code affiché juste devant toi, sur ton ordi ou un autre téléphone ? Alors continue. On te l'a envoyé (message, mail, réseau social) ? C'est une arnaque pour entrer dans ton compte : refuse.",
  refuserLien: "Non, refuser",
  continuerLien: "Je viens de scanner un QR",
  lienRefuse: "Bien joué : rien n'est parti, personne n'entre. Si on t'a envoyé ce lien, supprime le message et ne l'ouvre plus.",
  attention: "Si quelqu'un t'a envoyé ce QR ou ce lien (message, mail, réseau social), refuse : c'est une arnaque pour entrer dans ton compte.",
  questionConfirmer: "C'est toi, là, maintenant ?",
  refuser: "Non, refuser",
  accepter: "Oui, c'est moi",
  tempsRestant: (secondes: number) => `Encore ${secondes} seconde${secondes > 1 ? "s" : ""} pour répondre`,
  /** Lu par VoiceOver et TalkBack à quelques paliers seulement (pas chaque seconde) */
  plusQue: (secondes: number) => `Plus que ${secondes} seconde${secondes > 1 ? "s" : ""} pour répondre.`,
  raisonBiometrie: "Confirme que c'est bien toi pour connecter cet appareil",
  biometrieAnnulee: "Pas de confirmation, pas de connexion : rien n'a bougé. Retouche « Oui, c'est moi » pour réessayer.",
  fait: (appareil: string) => `Et voilà, connexion acceptée pour ${appareil} ! Tu peux la couper quand tu veux avec « Me déconnecter partout ».`,
  faitDemo: "Démo : sur un vrai compte, l'appareil serait maintenant connecté. Ici, rien n'est parti sur le serveur.",
  refuse: "Refusé : personne n'entre. Si quelqu'un t'a envoyé ce QR ou ce lien, c'est sûrement une arnaque : ne l'ouvre pas une deuxième fois.",
  expire: "Trop tard, ce QR a expiré. Demande-en un nouveau sur l'appareil à connecter, ça prend une seconde.",
  // Nouveau téléphone : montrer le QR et attendre
  titreAfficher: "Me connecter avec un QR code",
  sousTitreAfficher: "Ton autre téléphone, déjà connecté, n'a plus qu'à le scanner.",
  aideAfficher: "Sur ton téléphone déjà connecté : Profil → ⚙️ Réglages → Mon compte → « Connecter un appareil », puis vise ce QR.",
  scanne: "Bien vu ! Confirme maintenant sur ton autre téléphone…",
  accepteIci: "C'est accepté ! On ouvre ton compte…",
  entreeRatee: "C'est accepté, mais ton compte n'a pas pu s'ouvrir (le réseau, sûrement). Rien n'est perdu : touche « Réessayer ».",
  refuseAilleurs: "Refusé sur ton autre téléphone. Pas grave : si c'était une erreur, demande un nouveau QR.",
  expireIci: "Trop tard : ton autre téléphone n'a pas répondu à temps. Pas de panique, touche « Un nouveau QR code » et on recommence.",
  erreurPreparer: "Le QR code n'a pas pu être préparé. Réessaie dans un instant.",
  erreurAttente: "On a perdu le fil avec SOS Miam (le réseau, sûrement). Touche « Un nouveau QR code » dès que ça capte.",
  renouvele: "Nouveau QR toutes les 2 minutes : c'est plus sûr.",
};
