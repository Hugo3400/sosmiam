import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router";

import { PastilleFiltre } from "~/composants/page-lieux/PastilleFiltre";
import { TEXTES_PAGE_LIEUX_PAR_LANGUE } from "~/contenus/page-lieux";
import { ecrireAdresseLieux } from "~/fonctions/page-lieux/ecrire-adresse-lieux";
import { ecrireIdentifiantVille } from "~/fonctions/page-lieux/ecrire-identifiant-ville";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVilleProche } from "~/hooks/utiliser-ville-proche";
import type { CategorieLieu, VilleLieux } from "~/types/lieux";

type Props = {
  villes: readonly VilleLieux[];
  villeChoisie: VilleLieux | null;
  identifiantVille: string | null;
  type: CategorieLieu | null;
  recherche: string | null;
};

const VILLES_EN_AVANT = 8;
const VILLES_SUR_TELEPHONE = 3;

const fermerListe = (evenement: MouseEvent<HTMLElement>) => evenement.currentTarget.closest("details")?.removeAttribute("open");

export function FiltresVilles({ villes, villeChoisie, identifiantVille, type, recherche }: Props) {
  const T = utiliserTextes(TEXTES_PAGE_LIEUX_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const naviguer = useNavigate();
  const adresse = (ville: string | null) => lien(ecrireAdresseLieux({ ville, type, recherche }));
  const { possible, etat, chercherPresDeMoi } = utiliserVilleProche(villes, villeChoisie?.ville ?? null, T.presDeMoi, (ville) => {
    naviguer(adresse(ecrireIdentifiantVille(ville.ville)), { preventScrollReset: true });
  });
  const enAvant = villes.slice(0, VILLES_EN_AVANT);
  const choisieEnAvant = villeChoisie !== null && enAvant.some((ville) => ville.ville === villeChoisie.ville);
  const autres = villes
    .map((ville, rang) => ({ ...ville, rang }))
    .filter(({ rang }) => rang >= VILLES_SUR_TELEPHONE)
    .sort((a, b) => a.ville.localeCompare(b.ville, "fr"));

  return (
    <div className="relative flex flex-col gap-2">
      <div role="group" aria-labelledby="filtre-ville" className="flex flex-wrap items-center gap-2.5">
        <span id="filtre-ville" className="mr-1.5 text-sm font-bold">{T.filtres.ville}</span>
        {possible && (
          <button
            type="button"
            onClick={chercherPresDeMoi}
            aria-busy={etat.etat === "recherche"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-encre bg-white px-4 py-[7px] text-sm font-semibold hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
          >
            <span aria-hidden="true">📍</span>
            {T.presDeMoi.bouton}
          </button>
        )}
        <PastilleFiltre vers={adresse(null)} actif={identifiantVille === null}>{T.filtres.partout}</PastilleFiltre>
        {enAvant.map((ville, rang) => (
          <PastilleFiltre
            key={ville.ville}
            vers={adresse(ecrireIdentifiantVille(ville.ville))}
            actif={villeChoisie?.ville === ville.ville}
            className={rang >= VILLES_SUR_TELEPHONE && villeChoisie?.ville !== ville.ville ? "max-sm:hidden" : ""}
          >
            {ville.ville}
          </PastilleFiltre>
        ))}
        {villeChoisie && !choisieEnAvant && (
          <PastilleFiltre vers={adresse(ecrireIdentifiantVille(villeChoisie.ville))} actif>{villeChoisie.ville}</PastilleFiltre>
        )}
        {autres.length > 0 && (
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border-2 border-encre bg-white px-4 py-[7px] text-sm font-semibold hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre group-open:bg-jaune [&::-webkit-details-marker]:hidden">
              {T.filtres.autresVilles}
              <svg viewBox="0 0 24 24" className="size-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-carte border-2 border-encre bg-white p-4 shadow-brut">
              <p className="mb-2 font-bold">{T.filtres.autresVillesTitre}</p>
              <ul className="grid grid-cols-1 gap-x-5 gap-y-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {autres.map((ville) => (
                  <li key={ville.ville} className={ville.rang < VILLES_EN_AVANT ? "sm:hidden" : ""}>
                    <Link
                      to={adresse(ecrireIdentifiantVille(ville.ville))}
                      preventScrollReset
                      onClick={fermerListe}
                      aria-current={villeChoisie?.ville === ville.ville ? "true" : undefined}
                      className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1 text-sm hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-encre aria-[current=true]:bg-jaune"
                    >
                      <span className="font-semibold">{ville.ville}</span>
                      <span className="shrink-0 text-xs text-gris">{T.filtres.nombre(ville.nombre)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
      </div>
      <p role="status" className={etat.message ? "text-sm font-semibold text-gris" : "sr-only"}>{etat.message}</p>
    </div>
  );
}
