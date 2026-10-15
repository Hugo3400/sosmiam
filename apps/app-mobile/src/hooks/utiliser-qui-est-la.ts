import { useCallback, useState } from "react";

import type { QuiEstLaApi } from "@sos-miam/commun/types/communaute";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { CoucouMiami, MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { utiliserCommunaute, type ResultatAjoutBande } from "~/hooks/utiliser-communaute";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLectureCommunaute } from "~/hooks/utiliser-lecture-communaute";

export type ResultatVisibilite = { ok: true; visible: boolean; jusqua: string | null } | { ok: false; erreur: ErreurService };

export type ResultatCoucou = { ok: true; coucou: CoucouMiami } | { ok: false; erreur: ErreurService };

export type EtatQuiEstLa = {
  donnees: QuiEstLaApi | null;
  chargement: boolean;
  erreur: ErreurService | null;
  relire: () => Promise<void>;
  visibiliteEnCours: boolean;
  coucouEnCours: string | null;
  ajoutEnCours: string | null;
  demandeesIci: ReadonlySet<string>;
  estDemande: (id: string) => boolean;
  choisirVisibilite: (visible: boolean) => Promise<ResultatVisibilite>;
  envoyerCoucou: (personne: PersonneResume) => Promise<ResultatCoucou>;
  ajouterABande: (personne: PersonneResume) => Promise<ResultatAjoutBande>;
};

const ERREURS_PERSONNE_PARTIE: readonly ErreurService[] = ["personne-inconnue", "introuvable"];

function changerPresent(id: string, changer: (present: MiamiPresent) => MiamiPresent) {
  return (d: QuiEstLaApi): QuiEstLaApi => ({ ...d, presents: d.presents.map((p) => (p.personne.id === id ? changer(p) : p)) });
}

function retirerPresent(id: string) {
  return (d: QuiEstLaApi): QuiEstLaApi => ({ ...d, total: Math.max(0, d.total - 1), presents: d.presents.filter((p) => p.personne.id !== id) });
}

export function utiliserQuiEstLa(): EtatQuiEstLa {
  const { donnees, chargement, erreur, relire, remplacer } = utiliserLectureCommunaute((service) => service.lireQuiEstLa());
  const { enCours, agir } = utiliserGesteCommunaute();
  const { noterPersonne, demanderAjout, demandesEnvoyees } = utiliserCommunaute();
  const [demandeesIci, setDemandeesIci] = useState<ReadonlySet<string>>(new Set());
  const [ajoutEnCours, setAjoutEnCours] = useState<string | null>(null);

  const choisirVisibilite = useCallback(
    async (visible: boolean): Promise<ResultatVisibilite> => {
      const avant = donnees ? { visible: donnees.visible, jusqua: donnees.jusqua } : null;
      if (!visible) remplacer((d) => ({ ...d, visible: false, jusqua: null }));
      const r = await agir("visibilite", (service) => service.choisirVisibilite(visible));
      if (!r.ok) {
        if (avant) remplacer((d) => ({ ...d, ...avant }));
        if (r.erreur === "ville-requise") void relire();
        return r;
      }
      remplacer((d) => ({ ...d, visible: r.reponse.visible, jusqua: r.reponse.jusqua }));
      void relire();
      return { ok: true, visible: r.reponse.visible, jusqua: r.reponse.jusqua };
    },
    [donnees, remplacer, agir, relire],
  );

  const envoyerCoucou = useCallback(
    async (personne: PersonneResume): Promise<ResultatCoucou> => {
      const r = await agir(`coucou:${personne.id}`, (service) => service.envoyerCoucou(personne.id));
      if (!r.ok) {
        if (ERREURS_PERSONNE_PARTIE.includes(r.erreur)) remplacer(retirerPresent(personne.id));
        if (r.erreur === "invisible-ici") void relire();
        return r;
      }
      remplacer(changerPresent(personne.id, (p) => ({ ...p, coucou: r.reponse.coucou })));
      return { ok: true, coucou: r.reponse.coucou };
    },
    [agir, remplacer, relire],
  );

  const ajouterABande = useCallback(
    async (personne: PersonneResume): Promise<ResultatAjoutBande> => {
      noterPersonne(personne);
      setAjoutEnCours(personne.id);
      const resultat = await demanderAjout(personne.id);
      setAjoutEnCours(null);
      if (resultat.type === "ajoute" || resultat.type === "deja") remplacer(changerPresent(personne.id, (p) => ({ ...p, dansTaBande: true })));
      if (resultat.type === "demande") setDemandeesIci((avant) => new Set(avant).add(personne.id));
      return resultat;
    },
    [noterPersonne, demanderAjout, remplacer],
  );

  const estDemande = useCallback((id: string) => demandeesIci.has(id) || demandesEnvoyees.some((p) => p.id === id), [demandeesIci, demandesEnvoyees]);

  return {
    donnees,
    chargement,
    erreur,
    relire,
    visibiliteEnCours: enCours === "visibilite",
    coucouEnCours: enCours?.startsWith("coucou:") ? enCours.slice("coucou:".length) : null,
    ajoutEnCours,
    demandeesIci,
    estDemande,
    choisirVisibilite,
    envoyerCoucou,
    ajouterABande,
  };
}
