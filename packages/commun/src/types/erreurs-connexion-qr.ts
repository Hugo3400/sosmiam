// Les erreurs de la connexion par QR code (POST /app/qr/scanner et /app/qr/repondre, contrat dans
// apps/api/src/routes/connexion-qr.ts). Reprises dans ErreurService ; textes dans contenus/messages-connexion-qr.ts.
export type ErreurConnexionQr =
  | "connexion-qr-inconnue"
  | "connexion-qr-expiree"
  | "connexion-qr-deja-scannee"
  | "deja-repondu"
  | "session-app-requise";
