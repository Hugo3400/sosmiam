import { Router, type RequestHandler } from "express";

import { creerControleursCommentaires } from "../controleurs/commentaires.ts";
import { exigerChiffrementSocial } from "../middlewares/exiger-chiffrement-social.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Commentaires écrits, par compte */
export const LIMITE_COMMENTAIRES = { fenetre: 60 * 60_000, maximum: 20 };
/** Lecture publique (sans compte), par IP, comme les avis */
export const LIMITE_LECTURES_COMMENTAIRES_PUBLIQUES = { fenetre: 60_000, maximum: 120 };

const sansCache: RequestHandler = (_requete, reponse, suite) => {
  reponse.set("Cache-Control", "private, no-store");
  suite();
};

/**
 * /app/commentaires : les commentaires sous les publications du fil (décidé le 8 octobre 2026). Contenu public : la liste
 * d'une publication se lit SANS compte (visite comprise) et se met en cache public 30 s ; tout le reste demande une session
 * (Authorization: Bearer), jamais en cache. Écrire et modifier demandent un pseudo (exigerProfilSocial : 409 pseudo-requis) ;
 * lire « mes commentaires », aimer, supprimer le sien et masquer au nom du lieu, non (lireProfilSocial : rien n'est créé).
 * Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes (Retry-After) ; 400 champ-invalide
 * { champ } ; 400 message-refuse { champ: "texte" } (filtre de mots) ; 503 chiffrement-indisponible (🔐). Compte limité par
 * l'équipe (refuserSiLimite, après la session et la limite, avant le profil social) : 403 compte-limite { details: { jusqua } }
 * sur POST (commenter) et PATCH /:id (modifier) ; le reste passe (supprimer le sien, J'aime, masquer au nom du lieu).
 *
 * Sans session (cache public 30 s ; 120 lectures par minute et par IP) :
 * GET    /app/commentaires/publications/:publicationId[?apres=]
 *          → 200 { ok, commentaires: CommentaireApi[], total: number, suite } : 100 par page, les plus récents d'abord (l'app
 *          range avec trierCommentaires de commun : réponse du lieu en tête, plus aimés, plus récents) ; jamais un
 *          commentaire masqué par le lieu, suspendu ou retiré ; un commentaire supprimé qui a encore des réponses vient avec
 *          supprime: true et texte "" (« Commentaire supprimé ») ; total : les commentaires visibles · 404
 *          publication-inconnue (inconnue, pas publiée ou suspendue) · 400 champ-invalide { champ: "publicationId" | "apres" }
 *
 * Avec session, jamais en cache :
 * GET    /app/commentaires/publications/:publicationId/moi → 200 { ok, moi: MesCommentairesApi } : tes J'aime, tes
 *          commentaires masqués par le lieu ou suspendus (toi seul les vois, avec leur état), ceux que tu as signalés (à
 *          cacher), et si tu peux répondre au nom du lieu (gérant). Les commentaires des personnes que TU as bloquées sont
 *          cachés par l'app (liste de /app/blocages) ; ceux d'une personne qui t'a bloqué restent lisibles (ils le sont sans
 *          compte), sans pouvoir y répondre ni la citer · 404 publication-inconnue
 * POST   /app/commentaires/publications/:publicationId { texte, reponseA?: string, commeLieu?: boolean } → 201 { ok,
 *          commentaire } : texte de 1 à 500 caractères, filtre de mots ; reponseA : un commentaire visible de la même
 *          publication (une réponse à une réponse va sous son commentaire), sans blocage avec son auteur ; commeLieu :
 *          seulement le gérant du lieu de la publication (signé « le lieu ») ; les @pseudos (10 au plus) sont gardés avec
 *          leur identifiant public (inconnu, pas trouvable ou bloqué : texte simple). Cloche : « mention » pour la personne
 *          citée si elle suit l'auteur ou l'a dans sa bande, « reponse-commentaire » pour l'auteur du commentaire auquel on
 *          répond (cible : la publication ; une réponse du lieu part sans acteur, detail « lieu »). 20 par heure · 400
 *          champ-invalide { champ: "texte" | "reponseA" | "commeLieu" } · 403 reserve-au-gerant · 404 publication-inconnue |
 *          commentaire-inconnu
 * PATCH  /app/commentaires/:id { texte } → 200 { ok, commentaire } : le tien (ou une réponse du lieu, par son gérant) ;
 *          modifieLe, mentions recalculées, seules les nouvelles préviennent ; un signalement en cours garde l'instantané du
 *          texte jugé · 404 commentaire-inconnu · 403 reserve-a-l-auteur
 * DELETE /app/commentaires/:id → 200 { ok } : le tien (ou une réponse du lieu, par son gérant). Sans réponse ni
 *          signalement en cours : effacé ; sinon « Commentaire supprimé » (texte vidé), les réponses des autres restent · 404
 *          commentaire-inconnu · 403 reserve-a-l-auteur
 * PUT    /app/commentaires/:id/jaime ; DELETE /app/commentaires/:id/jaime → 200 { ok, jaimes: number } (personne n'est
 *          prévenu) · 404 commentaire-inconnu (aussi avec un blocage entre vous)
 * PUT    /app/commentaires/:id/masque (🔐) ; DELETE /app/commentaires/:id/masque → 200 { ok } : le gérant du lieu de la
 *          publication masque (ou démasque) le commentaire d'une personne. Masqué, il part en modération : un signalement
 *          { cible: "commentaire", raison: "autre", source: "lieu", explication: "Masqué par le lieu", instantané chiffré,
 *          auteurContenuId } (un seul ouvert par commentaire : masquer de nouveau le réutilise), et « contenu-masque »
 *          (detail « masque-par-le-lieu ») dans la cloche de son auteur. Un commentaire dont le masquage par le lieu a été
 *          REJETÉ par la modération ne peut plus être masqué par le lieu (sauf s'il a été modifié depuis) · 404
 *          commentaire-inconnu (une réponse du lieu ou ton propre commentaire ne se masquent pas : on les supprime) · 403
 *          reserve-au-gerant · 409 deja-examine
 */
export function creerRoutesCommentaires(d: Pick<DependancesSocialApp, "commentaires" | "chiffrement">, contexte: ContexteRoutesSociales) {
  const c = creerControleursCommentaires(d, contexte.horloge, contexte.appliquer);
  const { lectures, gestes, limiteConnectee, protection, refuserSiLimite } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  /** Session obligatoire, jamais en cache (la chaîne des autres domaines sociaux) */
  const session = [limiteConnectee, protection.exigerCompte, sansCache];
  const chiffre = exigerChiffrementSocial(d.chiffrement);

  const routes = Router();
  routes.get("/publications/:publicationId", limiterRequetes(LIMITE_LECTURES_COMMENTAIRES_PUBLIQUES), c.lister);
  routes.get("/publications/:publicationId/moi", ...session, lectures, lireProfilSocial, c.lireMiens);
  routes.post("/publications/:publicationId", ...session, contexte.parCompte(LIMITE_COMMENTAIRES), refuserSiLimite, exigerProfilSocial, c.commenter);
  routes.patch("/:id", ...session, gestes, refuserSiLimite, exigerProfilSocial, c.modifier);
  routes.delete("/:id", ...session, gestes, lireProfilSocial, c.supprimer);
  routes.put("/:id/jaime", ...session, gestes, lireProfilSocial, c.aimer(true));
  routes.delete("/:id/jaime", ...session, gestes, lireProfilSocial, c.aimer(false));
  routes.put("/:id/masque", ...session, chiffre, gestes, lireProfilSocial, c.masquer(true));
  routes.delete("/:id/masque", ...session, gestes, lireProfilSocial, c.masquer(false));
  return routes;
}
