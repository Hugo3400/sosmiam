import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";

export type ChoixModeration = { decision: "retenu" | "rejete"; note: string; motif: string | null; motivation: string | null };
type Props = {
  decision: "retenu" | "rejete";
  urgent: boolean;
  reexamen: boolean;
  enCours: boolean;
  erreur: string | null;
  onFermer: () => void;
  onConfirmer: (choix: ChoixModeration) => void;
};

/** Confirmer une décision. Pour retirer un contenu : la règle enfreinte et l'explication pour l'auteur (obligatoires). */
export function ModaleDecisionModeration({ decision, urgent, reexamen, enCours, erreur, onFermer, onConfirmer }: Props) {
  const [motif, setMotif] = useState("");
  const [motivation, setMotivation] = useState("");
  const [note, setNote] = useState("");
  const retirer = decision === "retenu";
  const valide = !retirer || (motif && motivation.trim().length >= 10);

  return (
    <Modale
      titre={reexamen ? (retirer ? "Réexamen : maintenir le retrait ?" : "Réexamen : remettre en ligne ?") : retirer ? "Retirer la publication ?" : "Rien à redire ?"}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante={retirer ? "danger" : "principal"} desactive={!valide} chargement={enCours}
            onClick={() => onConfirmer({ decision, note: note.trim(), motif: retirer ? motif : null, motivation: motivation.trim() || null })}>
            Confirmer
          </Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        <p>
          {retirer
            ? "La publication est retirée du fil pour tout le monde (elle passe en « Masquée »). Les signalements encore ouverts sur elle sont réglés du même coup."
            : reexamen
              ? "La publication revient en ligne pour tout le monde."
              : urgent
                ? "La publication est remise en ligne pour tout le monde. Les signalements encore ouverts sur elle sont réglés du même coup."
                : "La publication reste en ligne. Les signalements encore ouverts sur elle sont réglés du même coup."}
        </p>
        {retirer && (
          <>
            <Selecteur
              libelle="Règle enfreinte (citée à l'auteur)"
              valeur={motif}
              onChange={setMotif}
              options={[{ valeur: "", libelle: "Choisis la règle" }, ...Object.entries(MOTIFS_MODERATION).map(([valeur, m]) => ({ valeur, libelle: m.libelle }))]}
              className="w-full"
            />
            {motif && <p className="rounded-xl bg-creme px-3 py-2 text-[13px]">Règle des CGU : « {MOTIFS_MODERATION[motif]?.regle} ».</p>}
            <ZoneTexte
              libelle="Pourquoi, en clair (envoyé à l'auteur)"
              valeur={motivation}
              onChange={setMotivation}
              maximum={1000}
              lignes={3}
              placeholder="Ce qu'on a vu, concrètement : « La vidéo montre un client filmé sans son accord, visage visible. »"
              aide="Les faits, sans jugement sur la personne. Le règlement européen demande qu'on explique chaque retrait."
            />
          </>
        )}
        {!retirer && reexamen && (
          <ZoneTexte libelle="Pourquoi on change d'avis (facultatif, envoyé à l'auteur)" valeur={motivation} onChange={setMotivation} maximum={1000} lignes={2} />
        )}
        <ZoneTexte libelle="Note privée (pour toi, facultative)" valeur={note} onChange={setNote} maximum={500} lignes={2} />
        {erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{erreur}</p>}
      </div>
    </Modale>
  );
}
