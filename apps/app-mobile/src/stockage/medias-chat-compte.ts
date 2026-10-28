// Les photos et notes vocales du chat d'un compte, téléchargées depuis le serveur : gardées dans le cache du téléphone
// (« cache/chat/<ton identifiant public>/<message>.jpg|m4a », et tes notes en cours d'envoi dans « cache/chat/envois »), jamais ailleurs. Le système peut vider ce cache : elles se
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

export function lireFichierPhotoGroupe(monId: string, conversationId: string, numero: number): File | null {
  if (surLeWeb) return null;
  const dossier = new Directory(Paths.cache, DOSSIER, monId || "compte", "groupes");
  if (!dossier.exists) dossier.create({ intermediates: true, idempotent: true });
  const nom = conversationId.replace(/[^a-zA-Z0-9_-]/g, "");
  for (const ancien of dossier.list()) {
    if (ancien instanceof File && ancien.name.startsWith(`${nom}-`) && ancien.name !== `${nom}-${numero}.jpg`) {
      try {
        ancien.delete();
      } catch {
        continue;
      }
    }
  }
  return new File(dossier, `${nom}-${numero}.jpg`);
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

/**
 * Range dans le cache du chat un fichier à envoyer (la note vocale de l'enregistreur) : l'enregistreur peut jeter le sien
 * dès l'appel, l'envoi et ses nouveaux essais gardent celui-ci. Déplacé plutôt que copié (copié si ça échoue). Sur le web,
 * l'adresse du navigateur telle quelle.
 */
export async function garderEnvoiChat(uriTemporaire: string, extension: "m4a" | "jpg"): Promise<string> {
  if (surLeWeb) return uriTemporaire;
  const dossier = new Directory(Paths.cache, DOSSIER, "envois");
  if (!dossier.exists) dossier.create({ intermediates: true, idempotent: true });
  const destination = new File(dossier, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`);
  const source = new File(uriTemporaire);
  try {
    await source.move(destination);
  } catch {
    await source.copy(destination);
  }
  return destination.uri;
}

/** Une fois l'envoi confirmé, sa copie ne sert plus (seules celles de « cache/chat/envois » sont concernées) */
export function oublierEnvoiChat(uri: string): void {
  if (surLeWeb || !uri.includes(`/${DOSSIER}/envois/`)) return;
  try {
    const fichier = new File(uri);
    if (fichier.exists) fichier.delete();
  } catch {
    // Déjà parti : rien à faire
  }
}

/** Efface tout le cache des médias du chat (déconnexion, suppression du compte) */
export function effacerMediasChatCompte(): void {
  if (surLeWeb) return;
  try {
    const dossier = new Directory(Paths.cache, DOSSIER);
    if (dossier.exists) dossier.delete();
  } catch {
    // Le système l'a peut-être déjà vidé
  }
}
