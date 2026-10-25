import { useEffect, useRef, useState } from "react";

import { arrondirPosition, type Position } from "~/fonctions/carte-des-lieux/arrondir-position";
import { choisirVilleProche } from "~/fonctions/page-lieux/choisir-ville-proche";
import { trouverVille } from "~/fonctions/page-lieux/trouver-ville";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { VilleLieux } from "~/types/lieux";

export type TextesVilleProche = {
  recherche: string;
  refus?: string;
  indisponible?: string;
  horsDeFrance: string;
  tropDeDemandes: string;
  erreur: string;
  aucune: (commune: string) => string;
  voisine: (commune: string, ville: string) => string;
  dejaLa: (ville: string) => string;
  trouvee: (ville: string) => string;
};

export type EtatVilleProche = { etat: "attente" | "recherche" | "trouvee" | "erreur"; message: string };

const DECIMALES = 3;

export function utiliserVilleProche(
  villes: readonly VilleLieux[],
  villeActuelle: string | null,
  textes: TextesVilleProche,
  quandTrouvee: (ville: VilleLieux) => void,
) {
  const [possible, setPossible] = useState(false);
  const [etat, setEtat] = useState<EtatVilleProche>({ etat: "attente", message: "" });
  const tentative = useRef(0);

  useEffect(() => {
    setPossible("geolocation" in navigator && window.isSecureContext);
  }, []);

  function afficher(nouvelEtat: EtatVilleProche["etat"], message: string) {
    setEtat({ etat: nouvelEtat, message: lierPonctuation(message) });
  }

  async function chercherAutourDe(position: Position, numero = ++tentative.current) {
    afficher("recherche", textes.recherche);
    try {
      const reponse = await fetch("/localiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arrondirPosition(position, DECIMALES)),
      });
      const resultat: unknown = await reponse.json().catch(() => null);
      if (numero !== tentative.current) return;
      const corps = typeof resultat === "object" && resultat !== null ? (resultat as Record<string, unknown>) : {};
      if (corps.ok !== true || typeof corps.commune !== "string") {
        const message = corps.erreur === "hors-de-france" ? textes.horsDeFrance : corps.erreur === "trop-de-demandes" ? textes.tropDeDemandes : textes.erreur;
        return afficher("erreur", message);
      }
      const commune = { commune: corps.commune, region: typeof corps.region === "string" ? corps.region : "" };
      const proche = choisirVilleProche(commune, villes);
      if (!proche) return afficher("erreur", textes.aucune(commune.commune));
      if (villeActuelle && trouverVille(villeActuelle, [proche.ville])) return afficher("trouvee", textes.dejaLa(proche.ville.ville));
      afficher("trouvee", proche.memeCommune ? textes.trouvee(proche.ville.ville) : textes.voisine(commune.commune, proche.ville.ville));
      quandTrouvee(proche.ville);
    } catch {
      if (numero === tentative.current) afficher("erreur", textes.erreur);
    }
  }

  function chercherPresDeMoi() {
    if (etat.etat === "recherche") return;
    const numero = ++tentative.current;
    afficher("recherche", textes.recherche);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (numero === tentative.current) void chercherAutourDe({ latitude: coords.latitude, longitude: coords.longitude }, numero);
      },
      (erreur) => {
        if (numero !== tentative.current) return;
        const refus = erreur.code === erreur.PERMISSION_DENIED;
        afficher("erreur", (refus ? textes.refus : textes.indisponible) ?? textes.erreur);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  function oublier() {
    tentative.current += 1;
    setEtat({ etat: "attente", message: "" });
  }

  return { possible, etat, chercherPresDeMoi, chercherAutourDe, oublier };
}
