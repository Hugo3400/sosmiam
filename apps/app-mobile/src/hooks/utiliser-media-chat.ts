import { File } from "expo-file-system";
import { useEffect, useState } from "react";

import type { MessageChat } from "@sos-miam/commun/types/conversations";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { retrouverFichierChat } from "~/stockage/conversations-locales";
import { lireFichierMediaChat, oublierMediaChat } from "~/stockage/medias-chat-compte";

export type EtatMediaChat = {
  /** L'adresse du fichier à afficher ou à jouer, une fois là */
  fichier: string | undefined;
  /** « expire » : effacé par le serveur 90 jours après l'envoi ; « absent » : pas là (réseau, aperçu web), réessayé plus tard */
  etat: "pret" | "chargement" | "expire" | "absent";
};

// Un seul téléchargement à la fois par message, même si deux bulles le demandent
const enCours = new Map<string, Promise<"pret" | "expire" | "absent">>();

const lireFichierMessage = (fichier: string, source: string) => (source === "compte" || fichier.startsWith("exemple:") ? fichier : retrouverFichierChat(fichier));

/**
 * La photo ou la note vocale d'un message. Démo : le fichier gardé sur le téléphone. Compte connecté : ton propre envoi en
 * cours a déjà son fichier ; sinon, le média est téléchargé une fois depuis le serveur (avec ta session, jamais dans
 * l'adresse) puis gardé en cache. Un message qui n'est plus visible, ou dont le média a expiré, voit son fichier effacé.
 */
export function utiliserMediaChat(conversationId: string, message: MessageChat): EtatMediaChat {
  const source = utiliserSourceSociale();
  const monId = utiliserMonId();
  const { sociaux } = utiliserSession();
  const type = message.type === "vocal" ? "vocal" : "photo";
  const aTelecharger = source === "compte" && !message.fichier && !!message.media && message.media.etat === "disponible" && !message.etat;
  const [etat, setEtat] = useState<EtatMediaChat>(() => {
    if (message.fichier) return { fichier: lireFichierMessage(message.fichier, source), etat: "pret" };
    if (message.media?.etat === "expire") return { fichier: undefined, etat: "expire" };
    return { fichier: undefined, etat: aTelecharger ? "chargement" : "absent" };
  });

  useEffect(() => {
    if (message.fichier) {
      setEtat({ fichier: lireFichierMessage(message.fichier, source), etat: "pret" });
      return;
    }
    // Plus visible (supprimé, retiré…) ou expiré : le fichier en cache part
    if (source === "compte" && (message.etat || message.media?.etat === "expire")) {
      oublierMediaChat(monId, message.id, type);
      setEtat({ fichier: undefined, etat: message.media?.etat === "expire" ? "expire" : "absent" });
      return;
    }
    if (!aTelecharger) return;
    const fichier = lireFichierMediaChat(monId, message.id, type);
    if (!fichier) return setEtat({ fichier: undefined, etat: "absent" });
    if (fichier.exists) return setEtat({ fichier: fichier.uri, etat: "pret" });
    let actif = true;
    const cle = `${conversationId}/${message.id}`;
    let telechargement = enCours.get(cle);
    if (!telechargement) {
      telechargement = (async () => {
        try {
          const { url, entetes } = await sociaux.messagerie.preparerLectureMedia(conversationId, message.id);
          await File.downloadFileAsync(url, fichier, { headers: entetes });
          return "pret" as const;
        } catch (erreur) {
          // Un fichier commencé ne doit pas passer pour entier
          if (fichier.exists) fichier.delete();
          return String(erreur).includes("410") ? ("expire" as const) : ("absent" as const);
        } finally {
          enCours.delete(cle);
        }
      })();
      enCours.set(cle, telechargement);
    }
    void telechargement.then((fin) => {
      if (actif) setEtat({ fichier: fin === "pret" ? fichier.uri : undefined, etat: fin });
    });
    return () => {
      actif = false;
    };
  }, [conversationId, message.id, message.fichier, message.etat, message.media?.etat, source, monId, type, aTelecharger, sociaux]);

  return etat;
}
