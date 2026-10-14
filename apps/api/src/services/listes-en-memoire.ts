// Double en mémoire des listes de lieux (contrat dans listes-regles.ts), posé sur les tables partagées : mêmes règles que
// listes.ts. Une seule demande avance à la fois entre deux await : tout est vérifié AVANT d'écrire.
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import { MAX_CO_AUTEURS_LISTE, MAX_LIEUX_PAR_LISTE, MAX_LISTES_PAR_COMPTE } from "../../../../packages/commun/src/regles/listes.ts";
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import type { ListeResumeApi } from "../../../../packages/commun/src/types/listes.ts";
import type { ListeLieux } from "../base-de-donnees/client-genere/client.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { presenterListeDetail } from "../fonctions/social/presenter-liste-detail.ts";
import { presenterListeResume } from "../fonctions/social/presenter-liste-resume.ts";
import { DUREE_REFUS_CO_AUTEUR_JOURS, LISTES_PAR_PAGE, MAX_LISTES_PAR_RUBRIQUE, type RefusListe, type ServicesListes } from "./listes-regles.ts";
import { AUCUN_LIEN, type RelationsSociales } from "./relations-sociales-regles.ts";
import { bloquesEnMemoire, listerCachesEnMemoire, prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;
const refus = (erreur: RefusListe) => ({ ok: false, erreur }) as const;
/** Les plus récemment modifiées d'abord ; à la même milliseconde, la plus grande id d'abord */
const parModification = (a: ListeLieux, b: ListeLieux) => b.modifieLe.getTime() - a.modifieLe.getTime() || b.id - a.id;
/** Retire d'un tableau, sur place, les lignes qui répondent à `quoi` (comme un DELETE) */
function retirerLignes<T>(lignes: T[], quoi: (ligne: T) => boolean): void {
  for (let i = lignes.length - 1; i >= 0; i--) if (quoi(lignes[i]!)) lignes.splice(i, 1);
}

export function creerListesEnMemoire(tables: TablesSociales, relations: RelationsSociales): ServicesListes {
  const publie = (lieuId: number) => tables.lieux.get(lieuId)?.statut === "publie";
  const coAuteurDe = (listeId: number, compteId: number) => tables.coAuteurs.find((c) => c.listeId === listeId && c.compteId === compteId);
  const signaleesPar = (compteId: number) =>
    new Set([...tables.signalements.values()].filter((s) => s.signaleParId === compteId && s.cible === "liste").map((s) => s.cibleId));

  /** Règle de B.5 : auteur, ou (ni modération, ni blocage, ni signalée par toi) et peutVoirListe sur ton niveau */
  async function voit(compteId: number, liste: ListeLieux): Promise<boolean> {
    if (liste.auteurId === compteId) return true;
    if (liste.suspendueLe || liste.retireeLe || bloquesEnMemoire(tables, compteId, liste.auteurId)) return false;
    if (signaleesPar(compteId).has(String(liste.id))) return false;
    const lien = (await relations.lireLiens(compteId, [liste.auteurId])).get(liste.auteurId) ?? AUCUN_LIEN;
    const niveau = calculerNiveauProfil({ prive: tables.comptes.get(liste.auteurId)?.prive ?? false }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
    return peutVoirListe({ visibilite: liste.visibilite === "bande" ? "bande" : "tous" }, niveau, coAuteurDe(liste.id, compteId)?.statut === "accepte");
  }
  async function lireVisible(compteId: number, listeId: number): Promise<ListeLieux | null> {
    const liste = tables.listes.get(listeId);
    return liste && (await voit(compteId, liste)) ? liste : null;
  }
  /** Les lieux encore publiés, du plus récent au plus ancien */
  const lieuxDe = (listeId: number) => tables.lieuxListes
    .map((l, rang) => ({ l, rang }))
    .filter(({ l }) => l.listeId === listeId && publie(l.lieuId))
    .sort((a, b) => b.l.creeLe.getTime() - a.l.creeLe.getTime() || b.rang - a.rang)
    .map(({ l }) => l.lieuId);

  async function resumer(listes: readonly ListeLieux[]): Promise<ListeResumeApi[]> {
    const auteurs = await relations.presenter(listes.map((l) => l.auteurId));
    return listes.flatMap((l) => {
      const auteur = auteurs.get(l.auteurId);
      return auteur
        ? [presenterListeResume({ ...l, nombreLieux: lieuxDe(l.id).length, abonnes: tables.abonnementsListes.filter((a) => a.listeId === l.id).length }, auteur)]
        : [];
    });
  }
  async function detailler(compteId: number, liste: ListeLieux) {
    const [resume] = await resumer([liste]);
    if (!resume) return null;
    const coAuteurs = tables.coAuteurs.filter((c) => c.listeId === liste.id).sort((a, b) => a.creeLe.getTime() - b.creeLe.getTime());
    return presenterListeDetail(resume, {
      moi: compteId, auteurId: liste.auteurId, lieux: lieuxDe(liste.id), coAuteurs,
      abonne: tables.abonnementsListes.some((a) => a.listeId === liste.id && a.compteId === compteId),
      personnes: await relations.presenter(coAuteurs.map((c) => c.compteId)),
      caches: listerCachesEnMemoire(tables, compteId),
    });
  }
  /** La liste relue après un geste ; rend liste-inconnue si elle a disparu entre-temps */
  async function rendre(compteId: number, liste: ListeLieux) {
    const detail = await detailler(compteId, liste);
    return detail ? ({ ok: true, liste: detail } as const) : refus("liste-inconnue");
  }
  async function visiblesParmi(compteId: number, listes: readonly ListeLieux[]) {
    const gardees: ListeLieux[] = [];
    for (const l of listes) if (await voit(compteId, l)) gardees.push(l);
    return resumer(gardees.sort(parModification).slice(0, MAX_LISTES_PAR_RUBRIQUE));
  }
  const listesDe = (lignes: readonly { listeId: number }[]) => lignes.flatMap((l) => (tables.listes.has(l.listeId) ? [tables.listes.get(l.listeId)!] : []));

  return {
    async listerMiennes(compteId) {
      const miennes = [...tables.listes.values()].filter((l) => l.auteurId === compteId).sort(parModification);
      const mesLignes = (statut: string) => tables.coAuteurs.filter((c) => c.compteId === compteId && c.statut === statut);
      return {
        miennes: await resumer(miennes),
        coEcrites: await visiblesParmi(compteId, listesDe(mesLignes("accepte"))),
        suivies: await visiblesParmi(compteId, listesDe(tables.abonnementsListes.filter((a) => a.compteId === compteId))),
        invitations: await visiblesParmi(compteId, listesDe(mesLignes("invite"))),
      };
    },

    async listerADecouvrir(compteId, apres) {
      const curseur = lireCurseurDate(apres) ?? null;
      const caches = listerCachesEnMemoire(tables, compteId);
      const potes = new Set(tables.bande.filter((b) => b.compteId === compteId).map((b) => b.poteId));
      const suivis = new Set(tables.suivis.filter((s) => s.suiveurId === compteId && s.statut === "accepte").map((s) => s.suiviId));
      const masquees = new Set(tables.masques.filter((m) => m.compteId === compteId && m.cible === "liste").map((m) => m.cibleId));
      const signalees = signaleesPar(compteId);
      const coEcrites = new Set(tables.coAuteurs.filter((c) => c.compteId === compteId && c.statut === "accepte").map((c) => c.listeId));
      const candidates = [...tables.listes.values()]
        .filter((l) => l.auteurId !== compteId && !caches.has(l.auteurId) && !l.suspendueLe && !l.retireeLe)
        .filter((l) => potes.has(l.auteurId) || (suivis.has(l.auteurId) && l.visibilite === "tous"))
        .filter((l) => !masquees.has(String(l.id)) && !signalees.has(String(l.id)) && !coEcrites.has(l.id))
        .filter((l) => !curseur || l.modifieLe.getTime() < curseur.date.getTime() || (l.modifieLe.getTime() === curseur.date.getTime() && l.id < curseur.id))
        .sort(parModification);
      const page = candidates.slice(0, LISTES_PAR_PAGE);
      const derniere = page.at(-1);
      return {
        listes: await resumer(page),
        suite: candidates.length > LISTES_PAR_PAGE && derniere ? ecrireCurseurDate(derniere.modifieLe, derniere.id) : null,
      };
    },

    async lire(compteId, listeId) {
      const liste = await lireVisible(compteId, listeId);
      return liste ? detailler(compteId, liste) : null;
    },

    async creer(compteId, l, cle, maintenant) {
      const deja = await relations.lireIdempotence(compteId, cle, "liste");
      if (deja !== null) {
        const liste = await lireVisible(compteId, deja);
        const detail = liste ? await detailler(compteId, liste) : null;
        return detail ? { ok: true, liste: detail, cree: false } : refus("liste-inconnue");
      }
      if (tables.idempotence.some((x) => x.compteId === compteId && x.cle === cle)) return refus("cle-deja-prise");
      if ([...tables.listes.values()].filter((x) => x.auteurId === compteId).length >= MAX_LISTES_PAR_COMPTE) return refus("trop-de-listes");
      const id = prendreId(tables, "listes");
      const liste: ListeLieux = { id, auteurId: compteId, ...l, suspendueLe: null, retireeLe: null, creeLe: maintenant, modifieLe: maintenant };
      tables.listes.set(id, liste);
      await relations.noterIdempotence(compteId, cle, "liste", id, maintenant);
      const detail = await detailler(compteId, liste);
      return detail ? { ok: true, liste: detail, cree: true } : refus("liste-inconnue");
    },

    async modifier(compteId, listeId, m, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      if (Object.keys(m).length > 0) Object.assign(liste, m, { modifieLe: maintenant });
      return rendre(compteId, liste);
    },

    async supprimer(compteId, listeId) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      // Comme la base : ses lieux, co-auteurs et abonnés partent avec elle ; un signalement garde son instantané
      tables.listes.delete(listeId);
      retirerLignes(tables.lieuxListes, (x) => x.listeId === listeId);
      retirerLignes(tables.coAuteurs, (x) => x.listeId === listeId);
      retirerLignes(tables.abonnementsListes, (x) => x.listeId === listeId);
      return { ok: true };
    },

    async basculerLieu(compteId, listeId, lieuId, oui, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      const auteur = liste.auteurId === compteId;
      if (!auteur && coAuteurDe(listeId, compteId)?.statut !== "accepte") return refus("reserve-a-l-auteur");
      const ligne = tables.lieuxListes.find((x) => x.listeId === listeId && x.lieuId === lieuId);
      if (oui) {
        if (!publie(lieuId)) return refus("lieu-inconnu");
        if (ligne) return rendre(compteId, liste);
        if (tables.lieuxListes.filter((x) => x.listeId === listeId).length >= MAX_LIEUX_PAR_LISTE) return refus("liste-pleine");
        tables.lieuxListes.push({ listeId, lieuId, ajouteParId: compteId, creeLe: maintenant });
      } else {
        if (!ligne) return rendre(compteId, liste);
        // Un co-auteur ne retire que les lieux qu'il a ajoutés lui-même
        if (!auteur && ligne.ajouteParId !== compteId) return refus("reserve-a-l-auteur");
        retirerLignes(tables.lieuxListes, (x) => x === ligne);
      }
      liste.modifieLe = maintenant;
      return rendre(compteId, liste);
    },

    async inviterCoAuteur(compteId, listeId, invite, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      if (invite === compteId) return refus("champ-invalide");
      const pote = tables.bande.some((b) => b.compteId === compteId && b.poteId === invite);
      if (!pote || bloquesEnMemoire(tables, compteId, invite)) return refus("pas-dans-la-bande");
      const ligne = coAuteurDe(listeId, invite);
      const refusRecent = ligne?.statut === "refuse" && maintenant.getTime() - (ligne.reponduLe ?? ligne.creeLe).getTime() < DUREE_REFUS_CO_AUTEUR_JOURS * JOUR_MS;
      // Déjà là, ou refus de moins de 30 jours : la même réponse, sans rien envoyer
      if ((ligne && ligne.statut !== "refuse") || refusRecent) {
        const r = await rendre(compteId, liste);
        return r.ok ? { ...r, effets: [] } : r;
      }
      const occupes = tables.coAuteurs.filter((c) => c.listeId === listeId && (c.statut === "invite" || c.statut === "accepte")).length;
      if (occupes >= MAX_CO_AUTEURS_LISTE) return refus("trop-de-co-auteurs");
      if (ligne) Object.assign(ligne, { statut: "invite", creeLe: maintenant, reponduLe: null });
      else tables.coAuteurs.push({ listeId, compteId: invite, statut: "invite", creeLe: maintenant, reponduLe: null });
      const r = await rendre(compteId, liste);
      if (!r.ok) return r;
      return { ...r, effets: [{ quoi: "cloche", notification: { compteId: invite, type: "liste-coauteur", acteurId: compteId, cible: { type: "liste", id: String(listeId) }, detail: liste.titre } }] };
    },

    async accepterCoAuteur(compteId, listeId, maintenant) {
      const liste = tables.listes.get(listeId);
      const ligne = liste ? coAuteurDe(listeId, compteId) : undefined;
      if (!liste || ligne?.statut !== "invite") return refus("invitation-inconnue");
      const pote = tables.bande.some((b) => b.compteId === liste.auteurId && b.poteId === compteId);
      if (liste.suspendueLe || liste.retireeLe || !pote || bloquesEnMemoire(tables, compteId, liste.auteurId)) return refus("invitation-inconnue");
      Object.assign(ligne, { statut: "accepte", reponduLe: maintenant });
      return rendre(compteId, liste);
    },

    async retirerCoAuteur(compteId, listeId, membre, maintenant) {
      if (membre === "moi") {
        const ligne = coAuteurDe(listeId, compteId);
        if (ligne?.statut === "invite") Object.assign(ligne, { statut: "refuse", reponduLe: maintenant });
        else if (ligne?.statut === "accepte") retirerLignes(tables.coAuteurs, (c) => c === ligne);
        return { ok: true };
      }
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId !== compteId) return refus("reserve-a-l-auteur");
      // Un refus reste noté (l'auteur ne le voit pas) : le retirer permettrait de réinviter en boucle
      retirerLignes(tables.coAuteurs, (c) => c.listeId === listeId && c.compteId === membre && c.statut !== "refuse");
      return { ok: true };
    },

    async basculerAbonnement(compteId, listeId, oui, maintenant) {
      const liste = await lireVisible(compteId, listeId);
      if (!liste) return refus("liste-inconnue");
      if (liste.auteurId === compteId) return refus("champ-invalide");
      const deja = tables.abonnementsListes.some((a) => a.listeId === listeId && a.compteId === compteId);
      if (oui && !deja) tables.abonnementsListes.push({ listeId, compteId, creeLe: maintenant });
      if (!oui) retirerLignes(tables.abonnementsListes, (a) => a.listeId === listeId && a.compteId === compteId);
      return rendre(compteId, liste);
    },
  };
}
