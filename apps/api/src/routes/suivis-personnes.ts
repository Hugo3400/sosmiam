import { Router } from "express";

import { creerControleursSuivisPersonnes } from "../controleurs/suivis-personnes.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "./social-app.ts";

/** Nouveaux abonnements à des personnes, par compte */
export const LIMITE_SUIVIS_PERSONNES = { fenetre: 24 * 60 * 60_000, maximum: 200 };

/**
 * /app/suivis-personnes : suivre des personnes, à sens unique. Session obligatoire (Authorization: Bearer), jamais en
 * cache ; lectures : lireProfilSocial (rien n'est créé) ; écritures : exigerProfilSocial (409 pseudo-requis). On ne prévient
 * jamais l'autre d'un refus, d'un retrait ni d'un « ne plus suivre ». Suivre ne donne jamais accès au chat. Les lieux et les
 * pseudos de créateurs se suivent dans /app/activite. Erreurs { ok: false, erreur, champ? } : 401 session-expiree ; 429
 * trop-de-demandes (Retry-After) ; 400 champ-invalide { champ }.
 *
 * GET    /app/suivis-personnes     → 200 { ok, suivis: ResumeSuivisApi } : prive, compteurs, demandes reçues (sans celles que
 *          tu as refusées) et envoyées (refusées comprises, montrées « demande » : tu ne sais pas qu'elles l'ont été), 50
 *          chacune au plus, plus récentes d'abord
 * GET    /app/suivis-personnes/abonnes[?apres=]     → 200 { ok, liens: LienSuiviApi[], suite } (50 par page, plus récents
 *          d'abord, sans les personnes bloquées) · 400 champ-invalide { champ: "apres" }
 * GET    /app/suivis-personnes/abonnements[?apres=] → 200 { ok, liens, suite } (personnes seulement)
 * PUT    /app/suivis-personnes/abonnements/:personne
 *          → 201 { ok, etat: "suivi" | "demande", deja: false } : compte public, suivi tout de suite (« nouvel-abonne » dans
 *            sa cloche, enRetour si elle te suit) ; compte privé, une demande
 *          → 200 { ok, etat, deja: true } (une demande déjà refusée répond aussi « demande », deja: true : elle ne repart pas)
 *          · 400 champ-invalide { champ: "personne" } (toi) · 404 personne-inconnue (ou blocage) · 409 trop-d-abonnements
 *          (2 000) · 429 (200 par 24 h)
 * DELETE /app/suivis-personnes/abonnements/:personne → 200 { ok } : ne plus suivre, ou annuler la demande (refusée ou non)
 * POST   /app/suivis-personnes/demandes/:personne/accepter → 200 { ok, lien: LienSuiviApi } (« demande-acceptee » pour
 *          elle) : marche aussi sur une demande que tu avais refusée · 404 demande-inconnue
 * DELETE /app/suivis-personnes/demandes/:personne → 200 { ok } : refusée (sans prévenir ; effacée 30 jours après la demande)
 * DELETE /app/suivis-personnes/abonnes/:personne  → 200 { ok } : retirer un abonné
 * PUT    /app/suivis-personnes/confidentialite { prive: boolean } → 200 { ok, prive, acceptees: number } : passer en privé
 *          garde les abonnés ; repasser en public accepte toutes les demandes en attente (« demande-acceptee » pour chacun).
 *          PATCH /comptes/moi/profil { prive: false } fera de même quand la session Site y branchera creerApresPassageEnPublic
 *          · 400 champ-invalide { champ: "prive" }
 */
export function creerRoutesSuivisPersonnes(d: Pick<DependancesSocialApp, "suivis" | "relations">, contexte: ContexteRoutesSociales) {
  const c = creerControleursSuivisPersonnes(d, contexte.appliquer, contexte.horloge);
  const { lectures, gestes } = contexte;
  const { lireProfilSocial, exigerProfilSocial } = contexte.profils;

  const routes = Router();
  routes.get("/", lectures, lireProfilSocial, c.lireResume);
  routes.get("/abonnes", lectures, lireProfilSocial, c.lister("abonnes"));
  routes.get("/abonnements", lectures, lireProfilSocial, c.lister("abonnements"));
  routes.put("/abonnements/:personne", gestes, contexte.parCompte(LIMITE_SUIVIS_PERSONNES), exigerProfilSocial, c.suivre(true));
  routes.delete("/abonnements/:personne", gestes, exigerProfilSocial, c.suivre(false));
  routes.post("/demandes/:personne/accepter", gestes, exigerProfilSocial, c.accepterDemande);
  routes.delete("/demandes/:personne", gestes, exigerProfilSocial, c.refuserDemande);
  routes.delete("/abonnes/:personne", gestes, exigerProfilSocial, c.retirerAbonne);
  routes.put("/confidentialite", gestes, exigerProfilSocial, c.changerConfidentialite);
  return routes;
}
