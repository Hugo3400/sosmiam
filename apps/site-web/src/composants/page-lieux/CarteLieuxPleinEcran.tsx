import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { CarteDesLieux } from "~/composants/carte-des-lieux/CarteDesLieux";
import { CarteLieuChoisi } from "~/composants/carte-des-lieux/CarteLieuChoisi";
import { IconeCarte } from "~/composants/carte-des-lieux/IconeCarte";
import { LegendeCarte } from "~/composants/carte-des-lieux/LegendeCarte";
import { BoutonChercherZone } from "~/composants/page-lieux/BoutonChercherZone";
import { ChoixVueLieux } from "~/composants/page-lieux/ChoixVueLieux";
import { PastilleFiltre } from "~/composants/page-lieux/PastilleFiltre";
import { categoriesLieux } from "~/contenus/categories-lieux";
import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";
import { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCarteLieux } from "~/hooks/utiliser-carte-lieux";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import type { CategorieLieu, VilleLieux } from "~/types/lieux";

type Props = {
  ville: string | null;
  type: CategorieLieu | null;
  villes: readonly VilleLieux[];
  lieuInitial: number | null;
  adresseFermer: string;
  adresseType: (type: CategorieLieu | null) => string;
  adresseVille: (identifiant: string) => string;
};

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function CarteLieuxPleinEcran({ ville, type, villes, lieuInitial, adresseFermer, adresseType, adresseVille }: Props) {
  const T = TEXTES_CARTE_DES_LIEUX;
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const naviguer = useNavigate();
  const javascriptActif = utiliserJavascriptActif();
  const [seulementSos, setSeulementSos] = useState(false);
  const carte = utiliserCarteLieux({ ville, type, villes, lieuInitial, adresseVille });

  useEffect(() => {
    const element = dialogue.current;
    if (!element) return;
    if (element.open) element.close();
    element.showModal();
    titre.current?.focus();
    const racine = document.documentElement;
    const debordementAvant = racine.style.overflow;
    racine.style.overflow = "hidden";
    return () => {
      racine.style.overflow = debordementAvant;
      if (element.open) element.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogue}
      open
      aria-labelledby="titre-carte-plein-ecran"
      onCancel={(evenement) => {
        evenement.preventDefault();
        naviguer(adresseFermer);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-[#F4ECD8] p-0 text-encre backdrop:bg-encre/40"
    >
      <h1 id="titre-carte-plein-ecran" ref={titre} tabIndex={-1} className="sr-only">{T.titrePleinEcran}</h1>
      <CarteDesLieux
        className="absolute inset-0"
        titre={T.titrePleinEcran}
        epingles={carte.epingles}
        lieuChoisi={carte.choisi}
        surChoix={carte.choisir}
        surDeplacement={carte.noterDeplacement}
        seulementSos={seulementSos}
        lienListe={adresseFermer}
        meSituer
        grand
        classeBoutons="right-3 top-[148px] lg:right-6 lg:top-[120px]"
      >
        <LegendeCarte className="absolute right-6 bottom-9 z-10 hidden lg:flex" />
        {carte.etatEpingles === "erreur" && (
          <p role="alert" className="absolute top-[148px] left-3 z-10 mr-20 rounded-xl border-2 border-encre bg-white px-3 py-2 text-sm font-semibold lg:top-[120px] lg:left-6">
            {lierPonctuation(T.etats.epinglesIndisponibles)}
          </p>
        )}
        <div className="pointer-events-none absolute inset-x-3 bottom-8 z-10 flex flex-col items-center gap-3 lg:inset-x-6 lg:bottom-6">
          <BoutonChercherZone visible={carte.zoneDeplacee} message={carte.messageZone} surClic={carte.chercherZone} />
          {carte.epingleChoisie && (
            <CarteLieuChoisi className="pointer-events-auto w-full lg:w-[420px] lg:self-start" epingle={carte.epingleChoisie} surFermer={() => carte.choisir(null)} />
          )}
        </div>
      </CarteDesLieux>
      <div className="absolute inset-x-3 top-3 z-20 flex flex-col gap-2 lg:inset-x-6 lg:top-6 lg:flex-row lg:items-start lg:justify-between">
        <ChoixVueLieux vue="carte" adresseListe={adresseFermer} adresseCarte={adresseType(type)} className="shadow-brut-petit lg:hidden" />
        <div role="group" aria-label={T.boutons.filtres} className="flex items-center gap-2 overflow-x-auto rounded-[18px] border-2 border-encre bg-white p-2 shadow-brut lg:flex-wrap lg:overflow-visible lg:p-2.5">
          <p className="hidden px-2 font-titre text-xl font-extrabold lg:block">{ville ?? T.partout}</p>
          <PastilleFiltre vers={adresseType(null)} actif={type === null}>{TEXTES_PAGE_LIEUX.filtres.tout}</PastilleFiltre>
          {categoriesLieux.map((categorie) => (
            <PastilleFiltre key={categorie.valeur} vers={adresseType(categorie.valeur)} actif={type === categorie.valeur}>
              {categorie.libelle}
            </PastilleFiltre>
          ))}
          {javascriptActif && (
            <button
              type="button"
              aria-pressed={seulementSos}
              onClick={() => setSeulementSos((avant) => !avant)}
              className={`shrink-0 whitespace-nowrap rounded-full border-2 border-rouge-sos px-4 py-[7px] text-sm font-semibold ${FOCUS} ${seulementSos ? "bg-rouge-sos text-white" : "bg-rose-alerte text-rouge-texte"}`}
            >
              {T.boutons.enSos}
            </button>
          )}
        </div>
        <Link
          to={adresseFermer}
          className={`hidden shrink-0 items-center gap-2 rounded-full border-2 border-encre bg-jaune px-[18px] py-3 text-[15px] font-bold shadow-brut lg:inline-flex ${FOCUS}`}
        >
          <IconeCarte nom="fermer" className="size-[18px]" />
          {T.boutons.fermer}
        </Link>
      </div>
    </dialog>
  );
}
