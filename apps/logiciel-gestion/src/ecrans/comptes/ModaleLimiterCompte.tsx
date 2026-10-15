import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { DUREES_LIMITATION, limiterCompte } from "~/services/limitations.ts";

type Props = { compteId: number; prenom: string; onFermer: () => void; onLimite: () => void };

/** Limiter un compte : la règle en cause, le pourquoi (envoyé à la personne, dans l'app et par mail) et la durée. */
export function ModaleLimiterCompte({ compteId, prenom, onFermer, onLimite }: Props) {
  const [motif, setMotif] = useState("");
  const [motivation, setMotivation] = useState("");
  const [duree, setDuree] = useState("7");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const valide = motif !== "" && motivation.trim().length >= 10;

  async function confirmer() {
    setEtat({ enCours: true, erreur: null });
    try {
      await limiterCompte(compteId, { motif, motivation: motivation.trim(), jours: DUREES_LIMITATION.find((d) => d.valeur === duree)?.jours ?? null });
      onLimite();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.code === "deja-limite" ? "Ce compte est déjà limité : lève d'abord la limitation en cours." : expliquerErreur(erreur) });
    }
  }

  return (
    <Modale
      titre={`Limiter le compte de ${prenom} ?`}
      ouverte
      onFermer={onFermer}
      actions={<><Bouton onClick={onFermer}>Annuler</Bouton><Bouton variante="danger" desactive={!valide} chargement={etat.enCours} onClick={confirmer}>Limiter</Bouton></>}
    >
      <div className="grid gap-4">
        <p className="text-sm">
          Tant que ça dure, {prenom} ne peut plus rien faire que les autres voient (messages, commentaires, avis, sorties, listes, invitations, nouveau pseudo).
          Lire, ses visites, Miam Safe, l'export et la suppression du compte restent permis. {prenom} est prévenu·e dans l'app et par mail, et peut contester une fois.
        </p>
        <Selecteur
          libelle="Règle en cause (citée à la personne)"
          valeur={motif}
          onChange={setMotif}
          options={[{ valeur: "", libelle: "Choisis la règle" }, ...Object.entries(MOTIFS_MODERATION).map(([valeur, m]) => ({ valeur, libelle: m.libelle }))]}
          className="w-full"
        />
        <Selecteur libelle="Durée" valeur={duree} onChange={setDuree} options={DUREES_LIMITATION.map(({ valeur, libelle }) => ({ valeur, libelle }))} className="w-full" />
        <ZoneTexte
          libelle="Pourquoi, en clair (envoyé à la personne)"
          valeur={motivation}
          onChange={setMotivation}
          maximum={1000}
          lignes={3}
          placeholder="Les faits, sans jugement : « Plusieurs messages insultants envoyés à des membres de ta bande ces derniers jours. »"
        />
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Modale>
  );
}
