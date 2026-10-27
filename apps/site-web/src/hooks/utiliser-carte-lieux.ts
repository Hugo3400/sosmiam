import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { TEXTES_CARTE_DES_LIEUX_PAR_LANGUE } from "~/contenus/carte-des-lieux";
import type { Position } from "~/fonctions/carte-des-lieux/arrondir-position";
import { ecrireIdentifiantVille } from "~/fonctions/page-lieux/ecrire-identifiant-ville";
import { utiliserEpingles } from "~/hooks/utiliser-epingles";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVilleProche } from "~/hooks/utiliser-ville-proche";
import type { CategorieLieu, VilleLieux } from "~/types/lieux";

type Reglages = {
  ville: string | null;
  type: CategorieLieu | null;
  villes: readonly VilleLieux[];
  lieuInitial: number | null;
  adresseVille: (identifiant: string) => string;
};

const DUREE_MESSAGE = 6000;

export function utiliserCarteLieux({ ville, type, villes, lieuInitial, adresseVille }: Reglages) {
  const naviguer = useNavigate();
  const T = utiliserTextes(TEXTES_CARTE_DES_LIEUX_PAR_LANGUE);
  const { etat: etatEpingles, epingles } = utiliserEpingles(ville, type);
  const [choisi, setChoisi] = useState<number | null>(lieuInitial);
  const [centre, setCentre] = useState<Position | null>(null);
  const zone = utiliserVilleProche(villes, ville, T.zone, (trouvee) => {
    naviguer(adresseVille(ecrireIdentifiantVille(trouvee.ville)), { preventScrollReset: true });
  });
  const { oublier } = zone;

  useEffect(() => {
    if (zone.etat.etat === "attente" || zone.etat.etat === "recherche") return;
    const minuteur = window.setTimeout(oublier, DUREE_MESSAGE);
    return () => window.clearTimeout(minuteur);
  }, [zone.etat]);

  function chercherZone() {
    if (!centre) return;
    setCentre(null);
    void zone.chercherAutourDe(centre);
  }

  return {
    etatEpingles,
    epingles,
    choisi,
    choisir: setChoisi,
    epingleChoisie: epingles.find((epingle) => epingle.id === choisi) ?? null,
    zoneDeplacee: centre !== null,
    noterDeplacement: setCentre,
    chercherZone,
    messageZone: zone.etat.message,
  };
}
