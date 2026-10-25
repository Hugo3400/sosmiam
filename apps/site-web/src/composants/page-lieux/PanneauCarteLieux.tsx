import { BoutonCarte } from "~/composants/carte-des-lieux/BoutonCarte";
import { CarteDesLieux } from "~/composants/carte-des-lieux/CarteDesLieux";
import { CarteLieuChoisi } from "~/composants/carte-des-lieux/CarteLieuChoisi";
import { IconeCarte } from "~/composants/carte-des-lieux/IconeCarte";
import { LegendeCarte } from "~/composants/carte-des-lieux/LegendeCarte";
import { BoutonChercherZone } from "~/composants/page-lieux/BoutonChercherZone";
import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCarteLieux } from "~/hooks/utiliser-carte-lieux";
import type { CategorieLieu, VilleLieux } from "~/types/lieux";

type Props = {
  ville: string | null;
  type: CategorieLieu | null;
  villes: readonly VilleLieux[];
  adressePleinEcran: string;
  adresseVille: (identifiant: string) => string;
};

export function PanneauCarteLieux({ ville, type, villes, adressePleinEcran, adresseVille }: Props) {
  const T = TEXTES_CARTE_DES_LIEUX;
  const carte = utiliserCarteLieux({ ville, type, villes, lieuInitial: null, adresseVille });
  return (
    <section aria-labelledby="titre-carte-lieux" className="sticky top-[88px] h-[calc(100dvh-112px)] max-h-[1040px] min-h-[520px] overflow-hidden rounded-carte border-2 border-encre shadow-brut">
      <h2 id="titre-carte-lieux" className="sr-only">{T.titre}</h2>
      <a
        href="#liste-des-lieux"
        className="sr-only z-30 rounded-full border-2 border-encre bg-white px-4 py-2 text-sm font-bold focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        {T.voirListe}
      </a>
      <CarteDesLieux
        className="relative h-full"
        titre={T.titre}
        epingles={carte.epingles}
        lieuChoisi={carte.choisi}
        surChoix={carte.choisir}
        surDeplacement={carte.noterDeplacement}
        classeAttribution="left-2 bottom-2"
        avantBoutons={
          <BoutonCarte etiquette={T.boutons.pleinEcran} vers={adressePleinEcran} jaune>
            <IconeCarte nom="agrandir" />
          </BoutonCarte>
        }
      >
        <LegendeCarte className="absolute top-4 left-4 z-10 mr-[76px]" />
        {carte.etatEpingles === "erreur" && (
          <p role="alert" className="absolute top-20 left-4 z-10 mr-[76px] rounded-xl border-2 border-encre bg-white px-3 py-2 text-sm font-semibold">
            {lierPonctuation(T.etats.epinglesIndisponibles)}
          </p>
        )}
        <div className="pointer-events-none absolute inset-x-4 bottom-9 z-10 flex flex-col items-center gap-3">
          <BoutonChercherZone visible={carte.zoneDeplacee} message={carte.messageZone} surClic={carte.chercherZone} />
          {carte.epingleChoisie && (
            <CarteLieuChoisi className="pointer-events-auto w-full max-w-[420px] self-start" epingle={carte.epingleChoisie} surFermer={() => carte.choisir(null)} />
          )}
        </div>
      </CarteDesLieux>
    </section>
  );
}
