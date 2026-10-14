// Les photos et notes vocales du chat d'un compte, téléchargées depuis le serveur : gardées dans le cache du téléphone
// (« cache/chat/<ton identifiant public>/<message>.jpg|m4a »), jamais ailleurs. Le système peut vider ce cache : elles se
// retéléchargent alors. Un message supprimé, retiré ou dont le média a expiré (90 jours) voit son fichier effacé ; la
// déconnexion efface tout le dossier. Rien sur le web (aperçu de développement).
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const DOSSIER = "chat";
const surLeWeb = Platform.OS === "web";

/** Le fichier en cache d'une photo (jpg) ou d'une note vocale (m4a) ; null sur le web */
export function lireFichierMediaChat(monId: string, messageId: string, type: "photo" | "vocal"): File | null {
  if (surLeWeb) return null;
  const dossier = new Directory(Paths.cache, DOSSIER, monId || "compte");
  if (!dossier.exists) dossier.create({ intermediates: true, idempotent: true });
  return new File(dossier, `${messageId.replace(/[^a-zA-Z0-9_-]/g, "")}.${type === "photo" ? "jpg" : "m4a"}`);
}

/** Efface le fichier en cache d'un message (supprimé, retiré par la modération, média expiré) */
export function oublierMediaChat(monId: string, messageId: string, type: "photo" | "vocal"): void {
  try {
    const fichier = lireFichierMediaChat(monId, messageId, type);
    if (fichier?.exists) fichier.delete();
  } catch {
    // Déjà parti : rien à faire
  }
}

/** Efface tout le cache des médias du chat (déconnexion, suppression du compte, entrée ou sortie de la démo) */
export function effacerMediasChatCompte(): void {
  if (surLeWeb) return;
  try {
    const dossier = new Directory(Paths.cache, DOSSIER);
    if (dossier.exists) dossier.delete();
  } catch {
    // Le système l'a peut-être déjà vidé
  }
}
