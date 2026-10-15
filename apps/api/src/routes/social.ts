import { Router } from "express";

import { creerControleursExportSocial } from "../controleurs/export-social.ts";
import { creerControleursSocial } from "../controleurs/social.ts";
import { exigerChiffrementSocial } from "../middlewares/exiger-chiffrement-social.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Recherche par pseudo (frappe avec 300 ms d'attente) : la seule voie vers un pseudo exact, par compte */
export const LIMITE_RECHERCHE_PSEUDO = { fenetre: 10 * 60_000, maximum: 150 };
/** Contre l'aspiration de l'annuaire, par compte (même clé que la précédente) */
export const LIMITE_RECHERCHE_PSEUDO_JOUR = { fenetre: 24 * 60 * 60_000, maximum: 1000 };
/** Contre plusieurs comptes derrière une même connexion, par IP */
export const LIMITE_RECHERCHE_PSEUDO_IP = { fenetre: 10 * 60_000, maximum: 300 };
/** « Télécharger mes données sociales » : 2 par 24 h, par compte */
export const LIMITE_EXPORT_SOCIAL = { fenetre: 24 * 60 * 60_000, maximum: 2 };

/**
 * /app/social, /app/personnes, /app/masques : session obligatoire (Authorization: Bearer), jamais en cache. Lectures et
 * masques : lireProfilSocial (jamais créé, pas besoin de pseudo) ; POST et PATCH /app/social/moi : exigerProfilSocial
 * (409 pseudo-requis). Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429 trop-de-demandes (Retry-After) ;
 * 400 champ-invalide { champ }.
 *
 * GET    /app/social/moi           → 200 { ok, moi: MoiSocial | null } : null tant que le profil social n'existe pas (rien
 *          n'est créé)
 * POST   /app/social/moi           → 201 { ok, moi } (créé : identifiant public tiré au hasard, 10 caractères) | 200 { ok, moi }
 *          (il existait) : l'app l'appelle à l'ouverture de l'onglet Potes · 409 pseudo-requis
 * PATCH  /app/social/moi { trouvable?, suggerable?, activitePartagee?, pushSocial?: boolean } → 200 { ok, moi }
 *          · 400 champ-invalide { champ } · 409 pseudo-requis
 * GET    /app/social/pouls         → 200 { ok, pouls: PoulsSocial } : ce qui a changé (relu toutes les 30 s par l'app
 *          ouverte) ; sans profil social : tout à zéro, sauf la signature de la cloche (nonVues 0 : voir routes/cloche.ts)
 * GET    /app/social/export 🔐      → 200 { ok, export: ExportSocialApi } : TES données sociales, pour toi seul (droit d'accès
 *          et de portabilité, RGPD) : profil et réglages (null sans profil social, jamais créé ici), bande, demandes, blocages
 *          faits, suivis, conversations (type, titre déchiffré, pseudos des membres), TES messages déchiffrés (pour un média :
 *          date, type et taille), invitations aux groupes, réactions, sorties, listes, commentaires, J'aime, cloche,
 *          signalements faits, éléments masqués. Jamais les messages des autres, jamais ton code d'invitation
 *          · 503 chiffrement-indisponible (avant le compte des exports) · 429 trop-de-demandes (2 par 24 h)
 *
 * POST   /app/personnes/recherche { debut: string } → 200 { ok, resultats: { personne: PersonneResume, pote: boolean, prive:
 *          boolean }[] } : « @ » retiré, minuscules, 2 à 20 caractères ; le pseudo commence par ce début ; le pseudo exact
 *          en tête ; 10 au plus. Comptes privés compris (en-tête seul). Jamais : toi, qui tu as bloqué, qui t'a bloqué, un
 *          compte sans profil social, un compte « trouvable: false ». Le début cherché passe dans le corps : il n'est jamais
 *          écrit dans les journaux · 400 champ-invalide { champ: "debut" } · 429 (150 par 10 min et 1 000 par 24 h par
 *          compte, 300 par 10 min par IP)
 * GET    /app/personnes/suggestions → 200 { ok, suggestions: SuggestionPersonneApi[] } (10 au plus)
 * GET    /app/personnes/:personne  → 200 { ok, profil: ProfilCommunautaireApi } : ce que ton niveau permet
 *          (calculerNiveauProfil). Si c'est TOI qui l'as bloquée : l'en-tête seulement (niveau « prive ») et
 *          relation.bloque, pour « Débloquer » · 400 champ-invalide { champ: "personne" } · 404 personne-inconnue (inconnue,
 *          sans profil social, ou elle t'a bloqué)
 * GET    /app/personnes/:personne/abonnes[?apres=]     → 200 { ok, liens: LienSuiviApi[], suite } (50 par page, plus récents
 *          d'abord, sans les personnes bloquées) · 404 personne-inconnue · 403 profil-prive (niveau autre que « bande »)
 *          · 400 champ-invalide { champ: "apres" }
 * GET    /app/personnes/:personne/abonnements[?apres=] → idem (personnes seulement)
 * GET    /app/personnes/:personne/listes → 200 { ok, listes: ListeResumeApi[] } (celles que tu peux voir, 50 au plus, les
 *          plus récemment modifiées d'abord) · 404 personne-inconnue
 *
 * GET    /app/masques[?cible=<cible>] → 200 { ok, masques: { cible: CibleMasque, cibleId: string }[] } (500 au plus, les
 *          plus récents d'abord)
 * PUT    /app/masques/:cible/:cibleId → 200 { ok } : retiré de TA vue (sortie passée, ligne de « Quoi de neuf », liste de
 *          « À découvrir », lieu reçu, suggestion) · 409 trop-de-masques (2 000)
 * DELETE /app/masques/:cible/:cibleId → 200 { ok } (« Annuler »)
 *          cible : sortie | activite | liste | lieu-recu | suggestion (ce qu'on a signalé ne passe jamais par ici) ;
 *          cibleId : /^[a-z0-9:._-]{1,60}$/ · 400 champ-invalide { champ: "cible" | "cibleId" }
 */
export function creerRoutesSocial(d: DependancesSocialApp, contexte: ContexteRoutesSociales) {
  const c = creerControleursSocial(d, contexte.horloge);
  const exportSocial = creerControleursExportSocial(d, contexte.horloge);
  const { lectures, gestes } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;
  const recherche = [
    contexte.parCompte(LIMITE_RECHERCHE_PSEUDO), contexte.parCompte(LIMITE_RECHERCHE_PSEUDO_JOUR), limiterRequetes(LIMITE_RECHERCHE_PSEUDO_IP),
  ];

  const social = Router();
  social.get("/moi", lectures, lireProfilSocial, c.lireMoi);
  social.post("/moi", gestes, exigerProfilSocial, c.ouvrirProfil);
  social.patch("/moi", gestes, exigerProfilSocial, c.modifierReglages);
  social.get("/pouls", lectures, lireProfilSocial, c.lirePouls);
  social.get("/export", exigerChiffrementSocial(d.chiffrement), contexte.parCompte(LIMITE_EXPORT_SOCIAL), lireProfilSocial, exportSocial.exporter);

  const personnes = Router();
  personnes.post("/recherche", ...recherche, lireProfilSocial, c.chercher);
  personnes.get("/suggestions", lectures, lireProfilSocial, c.suggerer);
  personnes.get("/:personne", lectures, lireProfilSocial, c.lireProfil);
  personnes.get("/:personne/abonnes", lectures, lireProfilSocial, c.listerLiens("abonnes"));
  personnes.get("/:personne/abonnements", lectures, lireProfilSocial, c.listerLiens("abonnements"));
  personnes.get("/:personne/listes", lectures, lireProfilSocial, c.listerListes);

  const masques = Router();
  masques.get("/", lectures, lireProfilSocial, c.listerMasques);
  masques.put("/:cible/:cibleId", gestes, lireProfilSocial, c.masquer(true));
  masques.delete("/:cible/:cibleId", gestes, lireProfilSocial, c.masquer(false));

  return { social, personnes, masques };
}
