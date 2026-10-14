// Connexion par QR code, « comme Discord » (décidé le 14 octobre 2026, docs/decisions.md) : l'app déjà connectée scanne le
// QR d'un ordinateur (site) ou d'un nouveau téléphone, puis confirme (écran, puis Face ID, l'empreinte ou le code du
// téléphone). Contrat de l'API : session Site (routes /comptes/qr et /app/qr).

/** Un QR vit 2 minutes, et sert une seule fois */
export const DUREE_QR_CONNEXION_S = 120;
/** Après le scan, on a 60 secondes pour accepter */
export const DELAI_ACCEPTATION_QR_S = 60;
/** L'appareil qui montre le QR demande où ça en est toutes les 2 secondes (pas de WebSocket) */
export const INTERVALLE_ATTENTE_QR_MS = 2000;

export const textesConnexionQr = {
  // Téléphone déjà connecté : scanner, puis confirmer
  titreScanner: "Connecter un appareil",
  sousTitreScanner: "Ton ordinateur ou un nouveau téléphone, sans retaper ton mot de passe.",
  etapesScanner: [
    "Sur l'appareil à connecter, choisis « Me connecter avec un QR code » (sur sosmiam.fr ou dans l'app).",
    "Vise le QR code avec ce téléphone.",
    "Vérifie bien où ça se connecte, puis confirme avec Face ID, ton empreinte ou ton code.",
  ],
  viseur: "Viseur de l'appareil photo : vise le QR code de l'appareil à connecter, il sera lu tout seul",
  aideViseur: "Vise le QR code affiché sur l'appareil à connecter.",
  indiceScanner: "Allume l'appareil photo pour lire le QR code de l'appareil à connecter",
  pasUnQr: "Ce QR code ne sert pas à connecter un appareil. Vise celui de la page « Me connecter avec un QR code ».",
  attention: "Si quelqu'un t'a envoyé ce QR (message, mail, réseau social), refuse : c'est une arnaque pour entrer dans ton compte.",
  questionConfirmer: "C'est toi, là, maintenant ?",
  refuser: "Non, refuser",
  accepter: "Oui, c'est moi",
  raisonBiometrie: "Confirme que c'est bien toi pour connecter cet appareil",
  biometrieAnnulee: "Pas de confirmation, pas de connexion : rien n'a bougé. Retouche « Oui, c'est moi » pour réessayer.",
  fait: (appareil: string) =>
    `C'est fait ! ${appareil} est connecté à ton compte. Tu peux le déconnecter quand tu veux avec « Me déconnecter partout ».`,
  refuse: "Refusé : personne n'entre. Si quelqu'un t'a envoyé ce QR, c'est sûrement une arnaque, ne le scanne pas une deuxième fois.",
  expire: "Trop tard, ce QR a expiré. Demande-en un nouveau sur l'appareil à connecter, ça prend une seconde.",
  // Nouveau téléphone : montrer le QR et attendre
  titreAfficher: "Me connecter avec un QR code",
  sousTitreAfficher: "Ton autre téléphone, déjà connecté, n'a plus qu'à le scanner.",
  aideAfficher: "Sur ton téléphone déjà connecté : Profil → ⚙️ Réglages → Mon compte → « Connecter un appareil », puis vise ce QR.",
  scanne: "Bien vu ! Confirme maintenant sur ton autre téléphone…",
  refuseAilleurs: "Refusé sur ton autre téléphone. Pas grave : si c'était une erreur, demande un nouveau QR.",
  renouvele: "Nouveau QR toutes les 2 minutes : c'est plus sûr.",
};
