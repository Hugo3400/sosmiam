import { MENU, type Ecran } from "../../contenus/menu.ts";
import type { ResultatsRecherche } from "../../services/recherche.ts";
import { CIBLES_MODERATION } from "../../contenus/cibles-moderation.ts";

export type ResultatRecherche = { cle: string; groupe: string; titre: string; detail: string; ecran: Ecran; id: number | null };

const formaterJour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const sansAccents = (texte: string) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Les résultats de la recherche partout, à plat et dans l'ordre d'affichage : écrans d'abord, puis les données. */
export function listerResultatsRecherche(q: string, resultats: ResultatsRecherche | null): ResultatRecherche[] {
  const ecrans = MENU.flatMap((groupe) => groupe.entrees)
    .filter((entree) => q.trim() && sansAccents(entree.libelle).includes(sansAccents(q.trim())))
    .map((entree) => ({ cle: `ecran-${entree.ecran}`, groupe: "Écrans", titre: entree.libelle, detail: "Aller à l'écran", ecran: entree.ecran, id: null }));
  if (!resultats) return ecrans;
  return [
    ...ecrans,
    ...resultats.lieux.map((l) => ({ cle: `lieu-${l.id}`, groupe: "Lieux", titre: `${l.emoji} ${l.nom}`, detail: `${l.ville} · n° ${l.id} · ${l.statut}`, ecran: "lieux" as const, id: l.id })),
    ...resultats.comptes.map((c) => ({
      cle: `compte-${c.id}`, groupe: "Comptes", titre: c.pseudo ? `${c.prenom} (@${c.pseudo})` : c.prenom, detail: `${c.email} · n° ${c.id}${c.ambassadeur ? ` · ambassadeur (${c.ambassadeur.statut})` : ""}`, ecran: "utilisateurs" as const, id: c.id,
    })),
    ...resultats.publications.map((p) => ({ cle: `publication-${p.id}`, groupe: "Publications", titre: `${p.lieu.emoji} ${p.lieu.nom}`, detail: `${p.legende} · n° ${p.id}`, ecran: "publications" as const, id: p.id })),
    ...resultats.bigSos.map((b) => ({ cle: `big-sos-${b.id}`, groupe: "BIG SOS", titre: `${b.lieu.emoji} ${b.lieu.nom}`, detail: `${b.lieu.ville} · BIG SOS n° ${b.id} · ${b.statut}`, ecran: "big-sos" as const, id: b.id })),
    ...resultats.demandes.map((d) => ({ cle: `demande-${d.id}`, groupe: "Demandes de lieux", titre: d.nom, detail: `${d.ville} · ${d.statut}`, ecran: "demandes" as const, id: null })),
    ...resultats.inscrits.map((i) => ({ cle: `inscrit-${i.id}`, groupe: "Newsletter", titre: i.email, detail: i.ville ?? "", ecran: "newsletter" as const, id: null })),
    ...(resultats.signalements ?? []).map((s) => ({
      cle: `signalement-${s.id}`, groupe: "Signalements", titre: `Signalement n° ${s.id}`,
      detail: `${CIBLES_MODERATION[s.cible]?.le ?? s.cible} n° ${s.cibleId} · ${s.statut === "a-traiter" ? "à traiter" : s.statut}`, ecran: "moderation" as const, id: null,
    })),
    ...(resultats.defis ?? []).map((d) => ({ cle: `defi-${d.id}`, groupe: "Défis", titre: `${d.emoji} ${d.titre}`, detail: `du ${d.debut}${d.fin ? ` au ${d.fin}` : ", sans fin"}`, ecran: "defis" as const, id: null })),
    ...(resultats.missions ?? []).map((m) => ({ cle: `mission-${m.id}`, groupe: "Missions", titre: m.titre, detail: `${m.compte.prenom} · ${m.statut}`, ecran: "ambassadeurs" as const, id: m.compteId })),
    ...(resultats.evenements ?? []).map((e) => ({
      cle: `evenement-${e.id}`, groupe: "Événements", titre: e.titre, detail: `${e.lieu.nom} · ${e.lieu.ville} · ${formaterJour(e.debut)}${e.suspendu ? " · suspendu" : ""}`, ecran: "evenements" as const, id: null,
    })),
    ...(resultats.presse ?? []).map((f) => ({ cle: `presse-${f.id}`, groupe: "Espace presse", titre: f.nom, detail: `${f.famille} · ${f.format.toUpperCase()}`, ecran: "presse" as const, id: null })),
  ];
}
