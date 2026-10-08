import { Badge } from "~/composants/interface/Badge.tsx";
import { PHASES_BIG_SOS } from "~/contenus/big-sos.ts";
import type { Ecran } from "~/contenus/menu.ts";
import { RAISONS_SIGNALEMENT } from "~/contenus/raisons-signalement.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import type { PhaseBigSos } from "~/services/big-sos.ts";
import { lireHistoriqueLieu } from "~/services/lieux.ts";
import { LigneHistorique as Ligne } from "./LigneHistorique.tsx";
import { PartieHistorique as Partie } from "./PartieHistorique.tsx";

const STATUTS_SIGNALEMENT: Record<string, string> = { "a-traiter": "à traiter", retenu: "retenu (retiré)", rejete: "rejeté" };
const MISSIONS: Record<string, string> = { "a-faire": "à faire", faite: "faite", annulee: "annulée" };

/** La vie d'un lieu sur SOS Miam, sur sa fiche : publications, signalements, BIG SOS, missions, demande d'origine. */
export function HistoriqueLieu({ id, allerA }: { id: number; allerA?: (ecran: Ecran, id: number | null) => void }) {
  const { donnees: h } = utiliserChargement(() => lireHistoriqueLieu(id), [id]);
  if (!h) return null;
  return (
    <div className="grid gap-4 rounded-carte border border-ligne bg-white p-4">
      <p className="text-sm font-semibold text-gris">Sur SOS Miam</p>
      {h.demandes.length > 0 && (
        <p className="text-[13px]">
          {h.demandes.map((d) => `${d.origine === "lieu" ? "Le lieu s'est inscrit" : "Proposé par la communauté"} le ${formaterDate(d.creeLe)}`).join(" · ")}
        </p>
      )}
      <Partie titre="BIG SOS" nombre={h.bigSos.length}>
        {h.bigSos.map((b) => (
          <Ligne key={b.id} onClick={allerA && (() => allerA("big-sos", b.id))}>
            <Badge ton={PHASES_BIG_SOS[b.phase as PhaseBigSos]?.ton ?? "neutre"}>{PHASES_BIG_SOS[b.phase as PhaseBigSos]?.libelle ?? b.phase}</Badge>{" "}
            {b.debutLe ? `du ${formaterDate(b.debutLe)}` : `ouvert le ${formaterDate(b.creeLe)}`}
            {b.objectifCible ? ` · ${b.objectifAtteint} / ${b.objectifCible} ${b.objectifTitre ?? ""}` : ""}
          </Ligne>
        ))}
      </Partie>
      <Partie titre="Publications" nombre={h.publications.length}>
        {h.publications.map((p) => (
          <Ligne key={p.id} onClick={allerA && (() => allerA("publications", p.id))}>
            <span className="font-semibold">{p.auteurType === "lieu" ? "Le lieu" : `@${p.auteurPseudo}`}</span> · {p.legende}
            <span className="text-gris"> · {p.suspendue ? "masquée (signalement grave)" : p.statut}</span>
          </Ligne>
        ))}
      </Partie>
      <Partie titre="Signalements" nombre={h.signalements.length}>
        {h.signalements.map((s) => (
          <Ligne key={s.id} onClick={allerA && (() => allerA("moderation", null))}>
            {RAISONS_SIGNALEMENT[s.raison] ?? s.raison} · {STATUTS_SIGNALEMENT[s.statut] ?? s.statut} <span className="text-gris">· {formaterDate(s.creeLe)}</span>
          </Ligne>
        ))}
      </Partie>
      <Partie titre="Missions d'ambassadeurs" nombre={h.missions.length}>
        {h.missions.map((m) => (
          <Ligne key={m.id} onClick={allerA && (() => allerA("ambassadeurs", m.compte.id))}>
            <span className="font-semibold">{m.titre}</span> · {m.compte.prenom} · {MISSIONS[m.statut] ?? m.statut}
            {m.compteRendu && <span className="block text-gris">« {m.compteRendu.slice(0, 120)}{m.compteRendu.length > 120 ? "…" : ""} »</span>}
          </Ligne>
        ))}
      </Partie>
    </div>
  );
}
