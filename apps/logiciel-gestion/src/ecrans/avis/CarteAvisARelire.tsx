import { LIBELLES_MOTIF_AVIS_LOUCHE, LIBELLES_RAISON_RELECTURE } from "../../../../../packages/commun/src/contenus/raisons-relecture.ts";
import type { MotifAvisLouche, RaisonRelecture } from "../../../../../packages/commun/src/types/avis.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { trancherAvis, type AvisARelire } from "~/services/avis.ts";
import { ActionsAvis } from "./ActionsAvis.tsx";

type Props = { avis: AvisARelire; onDecide: () => void; ouvrirCompte: (id: number) => void };

const etoiles = (note: number) => "★".repeat(note) + "☆".repeat(Math.max(0, 5 - note));

/** Un avis en relecture : ce qu'il dit, pourquoi il est relu, l'avis des ambassadeurs, l'auteur vu par l'équipe, la décision. */
export function CarteAvisARelire({ avis: a, onDecide, ouvrirCompte }: Props) {
  const motifs = [...new Set(a.verdicts.motifs)].map((m) => LIBELLES_MOTIF_AVIS_LOUCHE[m as MotifAvisLouche] ?? m);
  return (
    <li className="flex flex-col gap-4 rounded-carte border border-ligne bg-white p-4 lg:flex-row">
      <div className="grid min-w-0 flex-1 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-titre text-base font-extrabold">{a.lieu.emoji} {a.lieu.nom}</p>
          <span className="text-[13px] text-gris">{a.lieu.ville}</span>
          {a.verifie ? <Badge ton="vert">Vérifié</Badge> : <Badge>Non vérifié</Badge>}
          {a.avecPhoto && <Badge ton="contour">📷 Photo</Badge>}
          {a.repasOffert && <Badge ton="contour">Repas offert</Badge>}
        </div>
        <p className="text-sm"><span aria-label={`${a.note} sur 5`} className="font-bold tracking-wider text-encre">{etoiles(a.note)}</span> · {a.signature} · {formaterDate(a.creeLe, true)}</p>
        <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{a.texte}</p>
        {a.raisonRelecture && <p className="text-[13px] text-gris">Relu parce que : {LIBELLES_RAISON_RELECTURE[a.raisonRelecture as RaisonRelecture] ?? a.raisonRelecture}</p>}
        <p className="text-[13px]">
          Ambassadeurs : {a.verdicts.ok + a.verdicts.louche === 0 ? "pas encore relu" : `${a.verdicts.ok} « ça va », ${a.verdicts.louche} « louche »`}
          {motifs.length > 0 && <span className="text-gris"> ({motifs.join(" · ")})</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-gris">
          <span>Auteur : {a.auteur.avis} avis en tout{a.auteur.masques ? `, dont ${a.auteur.masques} masqué(s)` : ""}</span>
          <Bouton petit variante="discret" onClick={() => ouvrirCompte(a.compteId)}>Voir le compte n° {a.compteId}</Bouton>
        </div>
      </div>
      <ActionsAvis
        le="l'avis"
        siMasque={`L'avis sort de la fiche, de la moyenne et du comptoir.${a.verifie && a.avecPhoto ? " Les 10 points de la photo sont retirés." : ""} L'auteur reçoit la règle enfreinte et ton explication, et peut contester pendant 6 mois.`}
        trancher={(decision) => trancherAvis(a.id, decision)}
        onDecide={onDecide}
      />
    </li>
  );
}
