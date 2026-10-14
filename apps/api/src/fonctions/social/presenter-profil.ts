import type { ListeResumeApi } from "../../../../../packages/commun/src/types/listes.ts";
import type { NiveauProfil, PersonneResume, ProfilCommunautaireApi, RelationApi } from "../../../../../packages/commun/src/types/social.ts";

/** Ce que voit sa bande (décision 5 du 14 octobre 2026 : ville, points, lieux sauvés et gardés réservés à la bande) */
export type ProfilBande = NonNullable<ProfilCommunautaireApi["bande"]>;

export type DonneesProfil = {
  personne: PersonneResume;
  prive: boolean;
  /** calculerNiveauProfil de commun (« bande » pour toi-même) */
  niveau: NiveauProfil;
  /** null : c'est toi */
  relation: RelationApi | null;
  compteurs: { abonnes: number; abonnements: number };
  badges: string[];
  /** Ses listes que TU peux voir (peutVoirListe, sans celles que tu as signalées) */
  listes: ListeResumeApi[];
  bande: ProfilBande | null;
  /** « Montrer mon activité à ma bande » : faux, ses lieux sauvés et gardés, ses points et rescousses du mois restent à lui */
  activitePartagee: boolean;
};

/**
 * Le profil tel que TON niveau le permet, et rien de plus : l'en-tête et les compteurs pour « prive » ; badges et listes à
 * partir de « public » ; ville, points, lieux sauvés et gardés seulement à « bande ». Une personne que TU as bloquée : son
 * en-tête seul (niveau « prive », compteurs à zéro) et relation.bloque, pour « Débloquer ».
 */
export function presenterProfil(d: DonneesProfil): ProfilCommunautaireApi {
  if (d.relation?.bloque) return { ...d.personne, niveau: "prive", prive: d.prive, compteurs: { abonnes: 0, abonnements: 0 }, relation: d.relation };
  const profil: ProfilCommunautaireApi = { ...d.personne, niveau: d.niveau, prive: d.prive, compteurs: d.compteurs, relation: d.relation };
  if (d.niveau === "prive") return profil;
  profil.badges = d.badges;
  profil.listes = d.listes;
  if (d.niveau === "bande" && d.bande) {
    const partagee = d.relation === null || d.activitePartagee;
    profil.bande = partagee ? d.bande : { ...d.bande, pointsDuMois: 0, rescoussesDuMois: 0, lieuxSauves: [], gardes: [] };
  }
  return profil;
}
