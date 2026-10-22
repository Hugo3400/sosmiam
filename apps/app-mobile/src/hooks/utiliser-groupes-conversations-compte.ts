import { File } from "expo-file-system";
import { useMemo, type RefObject } from "react";

import type { ServicesSociaux } from "@sos-miam/commun/client-api/services-sociaux";
import { LONGUEUR_MAX_TITRE_GROUPE } from "@sos-miam/commun/regles/chat";
import type { ConversationApi } from "@sos-miam/commun/types/messagerie";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { convertirMessageApi } from "~/fonctions/chat/convertir-message-api";
import { preparerPhotoProfil } from "~/fonctions/compte/preparer-photo-profil";
import type { EtatConversations } from "~/hooks/utiliser-conversations";
import { renouvelerPhotoGroupe } from "~/services/photos-groupes-chat";

type Options = {
  sociaux: ServicesSociaux;
  generation: RefObject<number>;
  noterPersonne: (p: PersonneResume) => void;
  noterPersonnes: (c: ConversationApi) => void;
  garderConversation: (c: ConversationApi) => void;
};

type Groupes = Pick<EtatConversations, "renommerGroupe" | "inviterAuGroupe" | "changerPhotoGroupe" | "listerPartages" | "chercherGifs">;

export function utiliserGroupesConversationsCompte({ sociaux, generation, noterPersonne, noterPersonnes, garderConversation }: Options): Groupes {
  return useMemo((): Groupes => {
    const garder = (c: ConversationApi) => {
      noterPersonnes(c);
      garderConversation(c);
    };

    return {
      renommerGroupe: async (id, titre, emoji) => {
        const propre = titre.trim();
        if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_GROUPE || contientMotInterdit(propre)) return "titre";
        const g = generation.current;
        const r = await sociaux.messagerie.modifierGroupe(id, { titre: propre, emoji });
        if (g !== generation.current) return "reseau";
        if (!r.ok) {
          const code: string = r.erreur;
          if (code === "message-refuse" || r.champ === "titre") return "titre";
          if (code === "reserve-aux-admins" || code === "geree-par-la-sortie" || code === "conversation-inconnue") return "interdit";
          return code === "compte-limite" ? "compte-limite" : "reseau";
        }
        garder(r.conversation);
        return "ok";
      },
      inviterAuGroupe: async (id, potes) => {
        const invites = [...new Set(potes)];
        if (invites.length === 0) return "ok";
        const g = generation.current;
        const r = await sociaux.messagerie.inviterAuGroupe(id, invites);
        if (g !== generation.current) return "reseau";
        if (!r.ok) {
          const code: string = r.erreur;
          if (code === "groupe-plein") return "plein";
          if (code === "reserve-aux-admins" || code === "pas-dans-la-bande" || code === "conversation-inconnue") return "interdit";
          return code === "compte-limite" ? "compte-limite" : "reseau";
        }
        garder(r.conversation);
        return "ok";
      },
      changerPhotoGroupe: async (id, uri) => {
        const g = generation.current;
        let r: Awaited<ReturnType<ServicesSociaux["messagerie"]["retirerPhotoGroupe"]>>;
        try {
          r = uri ? await sociaux.messagerie.envoyerPhotoGroupe(id, new File(await preparerPhotoProfil(uri))) : await sociaux.messagerie.retirerPhotoGroupe(id);
        } catch {
          return "reseau";
        }
        if (g !== generation.current) return "reseau";
        if (!r.ok) {
          const code: string = r.erreur;
          if (code === "reserve-aux-admins" || code === "geree-par-la-sortie" || code === "conversation-inconnue") return "interdit";
          return code === "trop-de-medias" || code === "stockage-plein" || code === "media-trop-lourd" ? "plein" : "reseau";
        }
        garder(r.conversation);
        renouvelerPhotoGroupe(id);
        return "ok";
      },
      listerPartages: async (id, type, avant) => {
        const r = await sociaux.messagerie.listerPartages(id, type, avant);
        if (!r.ok) return null;
        r.messages.forEach((m) => m.auteur && noterPersonne(m.auteur));
        return { messages: r.messages.map(convertirMessageApi), suite: r.suite };
      },
      chercherGifs: async (requete, page) => {
        const r = requete.type === "tendances" ? await sociaux.messagerie.listerGifTendances(page) : await sociaux.messagerie.chercherGif(requete.q, page);
        if (r.ok) return { gifs: r.gifs };
        const code: string = r.erreur;
        return { erreur: code === "gif-indisponible" ? "indisponible" : "reseau" };
      },
    };
  }, [sociaux, generation, noterPersonne, noterPersonnes, garderConversation]);
}
