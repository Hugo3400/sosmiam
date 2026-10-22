import { File } from "expo-file-system";
import { useEffect, useState, useSyncExternalStore } from "react";

import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { ecouterPhotosGroupes, lireNumeroPhotoGroupe } from "~/services/photos-groupes-chat";
import { retrouverFichierChat } from "~/stockage/conversations-locales";
import { lireFichierPhotoGroupe } from "~/stockage/medias-chat-compte";

type GroupeAvecPhoto = Pick<ConversationEnrichie, "id" | "type" | "photo" | "fichierPhoto">;

const enCours = new Map<string, Promise<boolean>>();

export function utiliserPhotoGroupe(conversation: GroupeAvecPhoto | null): string | undefined {
  const source = utiliserSourceSociale();
  const monId = utiliserMonId();
  const { sociaux } = utiliserSession();
  const id = conversation?.id ?? "";
  const lireNumero = () => lireNumeroPhotoGroupe(id);
  const numero = useSyncExternalStore(ecouterPhotosGroupes, lireNumero, lireNumero);
  const avecPhoto = conversation?.type === "groupe" && source === "compte" && conversation.photo === true;
  const cle = `${id}-${numero}`;
  const [telechargee, setTelechargee] = useState<{ cle: string; uri: string } | null>(null);

  useEffect(() => {
    if (!avecPhoto) return;
    const fichier = lireFichierPhotoGroupe(monId, id, numero);
    if (!fichier) return;
    if (fichier.exists) return setTelechargee({ cle, uri: fichier.uri });
    let actif = true;
    let telechargement = enCours.get(cle);
    if (!telechargement) {
      telechargement = (async () => {
        try {
          const { url, entetes } = await sociaux.messagerie.preparerLecturePhotoGroupe(id);
          await File.downloadFileAsync(url, fichier, { headers: entetes });
          return true;
        } catch {
          if (fichier.exists) fichier.delete();
          return false;
        } finally {
          enCours.delete(cle);
        }
      })();
      enCours.set(cle, telechargement);
    }
    void telechargement.then((ok) => {
      if (actif && ok) setTelechargee({ cle, uri: fichier.uri });
    });
    return () => {
      actif = false;
    };
  }, [avecPhoto, monId, id, numero, cle, sociaux]);

  if (!conversation || conversation.type !== "groupe") return undefined;
  if (source !== "compte") return conversation.fichierPhoto ? retrouverFichierChat(conversation.fichierPhoto) : undefined;
  return avecPhoto && telechargee?.cle === cle ? telechargee.uri : undefined;
}
