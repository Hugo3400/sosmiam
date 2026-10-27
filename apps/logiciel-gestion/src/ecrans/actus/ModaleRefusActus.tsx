import { useState } from "react";

import { MOTIFS_MODERATION as CODES_MOTIFS, type MotifModeration } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { TEXTES_ACTUS } from "~/contenus/actus.ts";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import type { RefusActus } from "~/services/actus.ts";

const T = TEXTES_ACTUS.refus;

type Props = { reponse?: boolean; onFermer: () => void; onConfirmer: (refus: RefusActus) => void };

export function ModaleRefusActus({ reponse, onFermer, onConfirmer }: Props) {
  const [motif, setMotif] = useState<MotifModeration | "">("");
  const [motivation, setMotivation] = useState("");
  const valide = motif !== "" && motivation.trim().length >= 10 && motivation.length <= 1000;

  return (
    <Modale
      titre={reponse ? T.titreReponse : T.titreArticle}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>{T.annuler}</Bouton>
          <Bouton variante="danger" desactive={!valide} onClick={() => motif && onConfirmer({ motif, motivation: motivation.trim() })}>{T.confirmer}</Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        <p>{reponse ? T.explicationReponse : T.explicationArticle}</p>
        <Selecteur
          libelle={T.motif}
          valeur={motif}
          onChange={setMotif}
          options={[{ valeur: "", libelle: T.choisir }, ...CODES_MOTIFS.map((valeur) => ({ valeur, libelle: MOTIFS_MODERATION[valeur]!.libelle }))]}
          className="w-full"
        />
        {motif && MOTIFS_MODERATION[motif] && <p className="rounded-xl bg-creme px-3 py-2 text-[13px]">{T.regle(MOTIFS_MODERATION[motif].regle)}</p>}
        <ZoneTexte libelle={T.pourquoi} valeur={motivation} onChange={setMotivation} maximum={1000} lignes={3} placeholder={T.placeholder} aide={T.aide} />
      </div>
    </Modale>
  );
}
