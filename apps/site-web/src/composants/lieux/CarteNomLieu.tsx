import { ActionsFicheLieu } from "~/composants/lieux/ActionsFicheLieu";
import { BadgeVerifie } from "~/composants/lieux/BadgeVerifie";
import { EtiquettesLieu } from "~/composants/lieux/EtiquettesLieu";
import { categoriesLieux } from "~/contenus/categories-lieux";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { nommerJourLangue } from "../../../../../packages/commun/src/fonctions/langue/nommer-jour-langue.ts";
import { formaterHeureCourte } from "~/fonctions/dates/formater-heure-courte";
import type { EtatOuverture } from "~/fonctions/lieux/decrire-ouverture";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import type { FichePublique } from "~/types/pro";

type Props = { lieu: FichePublique; ouverture: EtatOuverture | null; adresseFiche: string };

function ecrireOuverture(ouverture: EtatOuverture): string {
  const T = TEXTES_FICHE_LIEU.ouverture;
  if (ouverture.heure === null) return T.ouvertSansArret;
  const heure = ouverture.heure === "00:00" ? T.minuit : formaterHeureCourte(ouverture.heure) ?? ouverture.heure;
  if (ouverture.ouvert) return T.ouvert(heure);
  if (ouverture.quand === "aujourdhui") return T.fermeAujourdhui(heure);
  if (ouverture.quand === "demain") return T.fermeDemain(heure);
  return T.fermeJour(nommerJourLangue(ouverture.jourSemaine, "fr"), heure);
}

export function CarteNomLieu({ lieu, ouverture, adresseFiche }: Props) {
  const T = TEXTES_FICHE_LIEU;
  const libelle = categoriesLieux.find((uneCategorie) => uneCategorie.valeur === lieu.type)?.libelle;
  const categorie = libelle && normaliserRecherche(libelle).replace(/s$/, "") !== normaliserRecherche(lieu.info).trim() ? libelle : null;
  const ou = [lieu.quartier, lieu.ville].filter(Boolean).join(", ");
  const ligne = [lieu.info, categorie, lieu.prix, ou].filter(Boolean).join(" · ");
  return (
    <header className="flex flex-col gap-[18px] rounded-carte border-2 border-encre bg-white p-5 shadow-brut sm:p-6 md:px-9 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:gap-4 md:gap-[22px]">
          {lieu.logo && (
            <img
              src={lieu.logo}
              alt=""
              width={112}
              height={112}
              className="-mt-12 h-[76px] w-[76px] shrink-0 rounded-2xl border-[3px] border-encre bg-white object-cover shadow-brut md:-mt-[78px] md:h-28 md:w-28 md:rounded-3xl"
            />
          )}
          <div className="flex min-w-0 flex-col gap-2.5">
            <BadgeVerifie verifie={lieu.estVerifie} />
            <h1 className="text-[clamp(1.9rem,5vw,3.1rem)] font-extrabold tracking-[-1px] [overflow-wrap:anywhere]">{lieu.nom}</h1>
            <p className="text-[15px] text-gris md:text-lg">{ligne}</p>
          </div>
        </div>
        {(ouverture || lieu.decouvertPar) && (
          <div className="flex shrink-0 flex-col gap-1.5 md:items-end md:text-right">
            {ouverture && (
              <p className={`font-bold ${ouverture.ouvert ? "text-[#1E7B34]" : "text-rouge-texte"}`}>
                <span aria-hidden="true">● </span>
                {ecrireOuverture(ouverture)}
              </p>
            )}
            {lieu.decouvertPar && <p className="text-sm text-gris">{T.denichePar(lieu.decouvertPar)}</p>}
          </div>
        )}
      </div>
      <ActionsFicheLieu lieu={lieu} adresseFiche={adresseFiche} />
      {lieu.type !== "bar" && <EtiquettesLieu etiquettes={lieu.etiquettes ?? []} />}
      {!lieu.estVerifie && (
        <p className="rounded-xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm">
          {lierPonctuation(T.nonVerifie(lieu.source?.nom ?? null))}
        </p>
      )}
    </header>
  );
}
