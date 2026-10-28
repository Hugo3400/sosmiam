import { useCallback, useEffect, useRef, useState } from "react";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { utiliserLieux } from "~/hooks/utiliser-lieux";

type EtatLecture = "en-cours" | "ok" | "inconnu" | "hors-ligne";

export type LieuParId = {
  /** Le lieu, avant le filtre d'âge (à refaire à l'écran) ; undefined s'il n'est pas (ou pas encore) là */
  lieu: Lieu | undefined;
  /** Vrai tant qu'on le cherche encore (liste pas encore lue, ou lecture du lieu seul en cours) */
  enAttente: boolean;
  /** Le serveur n'a pas répondu : le lieu existe peut-être */
  horsLigne: boolean;
  /** Relance la lecture après un « hors ligne » */
  reessayer: () => void;
};

/**
 * Un lieu par son identifiant (fiche, carte, proposition) : pris dans la liste, ou lu seul sur le serveur s'il n'y est pas
 * (lien partagé, lieu tout juste publié). Une seule lecture par identifiant, sauf « Réessayer ».
 */
export function utiliserLieuParId(identifiant: number | string | null | undefined): LieuParId {
  const { trouverLieu, pret, chargerLieu } = utiliserLieux();
  // L'identifiant d'une route est du texte (« 12 ») : autre chose qu'un entier (0 compris) ne cherche rien
  const id = typeof identifiant === "number" ? (Number.isInteger(identifiant) && identifiant >= 0 ? identifiant : null) : /^(0|[1-9]\d{0,9})$/.test(identifiant ?? "") ? Number(identifiant) : null;
  const lieu = id === null ? undefined : trouverLieu(id);
  const demandes = useRef(new Set<number>());
  const [etats, setEtats] = useState<Record<number, EtatLecture>>({});
  const [relance, setRelance] = useState(0);
  const present = lieu !== undefined;

  useEffect(() => {
    if (id === null || !pret || present || demandes.current.has(id)) return;
    demandes.current.add(id);
    setEtats((e) => ({ ...e, [id]: "en-cours" }));
    chargerLieu(id).then((r) => setEtats((e) => ({ ...e, [id]: r.ok ? "ok" : r.raison })));
  }, [id, pret, present, chargerLieu, relance]);

  const reessayer = useCallback(() => {
    if (id === null) return;
    demandes.current.delete(id);
    setRelance((n) => n + 1);
  }, [id]);

  const etat = id === null ? undefined : etats[id];
  // Pas encore demandé (le rendu d'avant l'effet) : on attend aussi, pour ne pas dire « pas disponible » une fraction de seconde
  const enAttente = id !== null && !present && (!pret || etat === undefined || etat === "en-cours");
  return { lieu, enAttente, horsLigne: !present && etat === "hors-ligne", reessayer };
}
