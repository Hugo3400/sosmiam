import type { Href } from "expo-router";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CLOCHE_PAR_LANGUE } from "~/contenus/textes-cloche";
import type { Publication } from "~/contenus/type-publication";
import { decrireNotificationCloche } from "~/fonctions/notifications/decrire-notification-cloche";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { NotificationApp } from "~/hooks/utiliser-notifications";

/**
 * Ce qu'une ligne de notification affiche : un emoji (avatar, 🎬, emoji du lieu), une phrase, et ce qu'elle ouvre. alcool :
 * la notification cite une publication de bar ou qui parle d'alcool (le message sanitaire s'affiche dessous). indice : ce
 * que la ligne ouvre, lu par VoiceOver (cloche du serveur ; sinon, d'après la clé)
 */
export type NotificationDecrite = { emoji: string; texte: string; ouvrir: Href | null; alcool?: boolean; indice?: string };

type Sources = {
  trouverPote: (id: string) => Pote | null;
  publications: readonly Publication[];
  /** Lieux connus : une publication d'un lieu absent n'est pas décrite */
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
 * personne inconnue, publication ou lieu disparu. Le filtre des bloqués est fait avant, par le fournisseur. Les types de la
 * cloche du serveur sont écrits par decrireNotificationCloche.
 */
export function decrireNotificationSuivi(n: NotificationApp, sources: Sources, langue: Langue): NotificationDecrite | null {
  if (n.type === "cloche") return decrireNotificationCloche(n, sources, langue);
  const T = choisirTextes(TEXTES_CLOCHE_PAR_LANGUE, langue);
  const { trouverPote, publications, lieux } = sources;
  const cible = lireCleSuivi(n.cle);
  if (!cible) return null;

  if (n.type === "nouvel-abonne" || n.type === "demande-acceptee") {
    if (cible.type !== "personne") return null;
    const pote = trouverPote(cible.id);
    if (!pote) return null;
    const texte = n.type === "demande-acceptee" ? T.demandeAcceptee(pote.prenom) : n.enRetour ? T.suitEnRetour(pote.prenom) : T.suitMaintenant(pote.prenom);
    return { emoji: pote.avatar, texte: lierPonctuation(texte), ouvrir: { pathname: "/potes/profil/[id]", params: { id: pote.id } } };
  }

  // Nouvelle publication d'un lieu ou d'un créateur que tu suis
  const publication = publications.find((p) => p.id === n.publicationId);
  if (!publication) return null;
  const lieu = lieux.find((l) => l.id === publication.lieuId);
  if (!lieu) return null;
  const extrait = couperLegende(publication.legende);
  const alcool = lieu.type === "bar" || parleDAlcool(publication.legende);
  if (cible.type === "createur") {
    return {
      emoji: "🎬",
      texte: lierPonctuation(T.createurAPoste(cible.pseudo, extrait)),
      ouvrir: { pathname: "/createur/[pseudo]", params: { pseudo: cible.pseudo } },
      alcool,
    };
  }
  if (cible.type === "lieu" && cible.id === lieu.id) {
    return { emoji: lieu.emoji, texte: lierPonctuation(T.lieuAPoste(lieu.nom, extrait)), ouvrir: { pathname: "/lieu/[id]", params: { id: String(lieu.id) } }, alcool };
  }
  return null;
}
