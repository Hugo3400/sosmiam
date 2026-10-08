import type { Href } from "expo-router";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { NotificationSuivi } from "@sos-miam/commun/types/suivis";
import type { Publication } from "~/contenus/type-publication";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Ce qu'une ligne de notification affiche : un emoji (avatar, 🎬, emoji du lieu, 🎂), une phrase, et ce qu'elle ouvre */
export type NotificationDecrite = { emoji: string; texte: string; ouvrir: Href | null };

type Sources = {
  trouverPote: (id: string) => Pote | null;
  publications: readonly Publication[];
  /** Lieux déjà filtrés selon ton âge : une publication d'un lieu absent n'est pas décrite */
  lieux: readonly Lieu[];
};

const LONGUEUR_MAX_EXTRAIT = 60;

/** La légende sur une ligne, coupée à 60 caractères (sans couper un emoji en deux) */
const couperLegende = (legende: string) => {
  const caracteres = Array.from(legende.replace(/\s+/g, " ").trim());
  return caracteres.length <= LONGUEUR_MAX_EXTRAIT ? caracteres.join("") : `${caracteres.slice(0, LONGUEUR_MAX_EXTRAIT).join("").trimEnd()}…`;
};

/**
 * La phrase d'une notification, prête à afficher (ponctuation liée). Rend null si ce dont elle parle n'existe plus :
 * personne inconnue, publication disparue, lieu écarté par l'âge. Le filtre des bloqués et de l'âge des personnes est
 * fait avant, par le fournisseur.
 */
export function decrireNotificationSuivi(n: NotificationSuivi, { trouverPote, publications, lieux }: Sources): NotificationDecrite | null {
  if (n.type === "majorite") {
    return {
      emoji: "🎂",
      texte: lierPonctuation(
        "Joyeux 18 ans ! Tes abonnés et abonnements restent. Par contre, plus de nouveaux abonnements avec des 15-17 ans, sauf les créateurs : c'est la règle qui protège tout le monde. Ta bande ne bouge pas.",
      ),
      ouvrir: null,
    };
  }

  const cible = lireCleSuivi(n.cle);
  if (!cible) return null;

  if (n.type === "nouvel-abonne" || n.type === "demande-acceptee") {
    if (cible.type !== "personne") return null;
    const pote = trouverPote(cible.id);
    if (!pote) return null;
    const texte =
      n.type === "demande-acceptee"
        ? `${pote.prenom} a accepté ta demande : bienvenue dans ses bons plans !`
        : n.enRetour
          ? `${pote.prenom} te suit en retour 🎉`
          : `${pote.prenom} te suit maintenant 👋`;
    return { emoji: pote.avatar, texte: lierPonctuation(texte), ouvrir: { pathname: "/potes/profil/[id]", params: { id: pote.id } } };
  }

  // Nouvelle publication d'un lieu ou d'un créateur que tu suis
  const publication = publications.find((p) => p.id === n.publicationId);
  if (!publication) return null;
  const lieu = lieux.find((l) => l.id === publication.lieuId);
  if (!lieu) return null;
  const extrait = couperLegende(publication.legende);
  if (cible.type === "createur") {
    return {
      emoji: "🎬",
      texte: lierPonctuation(`@${cible.pseudo} a posté : « ${extrait} »`),
      ouvrir: { pathname: "/createur/[pseudo]", params: { pseudo: cible.pseudo } },
    };
  }
  if (cible.type === "lieu" && cible.id === lieu.id) {
    return { emoji: lieu.emoji, texte: lierPonctuation(`${lieu.nom} a posté : « ${extrait} »`), ouvrir: { pathname: "/lieu/[id]", params: { id: String(lieu.id) } } };
  }
  return null;
}
