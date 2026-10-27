import { useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/carte-du-lieu";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { EnTeteCarteEnGrand } from "~/composants/lieux/EnTeteCarteEnGrand";
import { FiltresCarte } from "~/composants/lieux/FiltresCarte";
import { NavRubriquesCarte } from "~/composants/lieux/NavRubriquesCarte";
import { RubriqueCarteEnGrand } from "~/composants/lieux/RubriqueCarteEnGrand";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { TEXTES_CARTE_EN_GRAND_PAR_LANGUE } from "~/contenus/carte-en-grand";
import { site } from "~/contenus/legal/informations-legales";
import { filtrerRubriquesCarte } from "~/fonctions/carte/filtrer-rubriques-carte";
import { listerFiltresCarte } from "~/fonctions/carte/lister-filtres-carte";
import { listerRubriquesCarte } from "~/fonctions/carte/lister-rubriques-carte";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { estFicheIndexable } from "~/fonctions/lieux/est-fiche-indexable";
import { lireIdLieu } from "~/fonctions/lieux/lire-id-lieu";
import { creerDonneesFilAriane } from "~/fonctions/seo/creer-donnees-fil-ariane";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { chargerFicheLieu } from "~/services/fiche-lieu.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";
import type { FiltreCarte } from "~/types/carte";

const DESCRIPTION_MAX = 155;

export async function loader({ request, params }: Route.LoaderArgs) {
  const { negociee } = lireLangueRequete(request);
  const lieuId = lireIdLieu(params.id);
  if (lieuId === null) throw data(null, { status: 404 });
  const reponse = await chargerFicheLieu(lieuId, lireIpVisiteur(request));
  if (!reponse.ok && reponse.erreur === "lieu-inconnu") throw data(null, { status: 404 });
  if (!reponse.ok) throw data(null, { status: 503 });
  const { lieu } = reponse;
  if (!lieu.carte || listerRubriquesCarte(lieu.carte).length === 0) throw data(null, { status: 404 });
  const page = {
    lieu: { id: lieu.id, nom: lieu.nom, ville: lieu.ville, type: lieu.type, logo: lieu.logo ?? null, estVerifie: lieu.estVerifie, source: lieu.source ?? null },
    carte: lieu.carte,
  };
  return data(page, { headers: { "Cache-Control": negociee ? "private, max-age=60" : "public, max-age=60" } });
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_CARTE_EN_GRAND_PAR_LANGUE, langue);
  if (!loaderData) return [{ title: T.meta.introuvable }, { name: "robots", content: "noindex" }];
  const { lieu, carte } = loaderData;
  const titres = listerRubriquesCarte(carte).map((rubrique) => rubrique.titre).join(", ");
  const description = T.meta.description(lieu.nom, titres);
  const balises = creerMeta({
    titre: T.meta.titre(lieu.nom, lieu.ville),
    description: description.length > DESCRIPTION_MAX ? `${description.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…` : description,
    langue,
  });
  return estFicheIndexable(lieu) ? balises : [...balises, { name: "robots", content: "noindex" }];
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return { "Cache-Control": loaderHeaders.get("Cache-Control") ?? "public, max-age=60" };
}

export default function PageCarteDuLieu({ loaderData }: Route.ComponentProps) {
  const { lieu, carte } = loaderData;
  const T = utiliserTextes(TEXTES_CARTE_EN_GRAND_PAR_LANGUE);
  const langue = utiliserLangue();
  const lien = utiliserLienLangue();
  const javascriptActif = utiliserJavascriptActif();
  const [recherche, changerRecherche] = useState("");
  const [filtres, changerFiltres] = useState<FiltreCarte[]>([]);
  const rubriques = listerRubriquesCarte(carte);
  const visibles = javascriptActif ? filtrerRubriquesCarte(rubriques, recherche, filtres) : rubriques;
  const nombre = visibles.reduce((total, rubrique) => total + rubrique.elements.length, 0);
  const date = carte.majLe ? ecrireDateAParisLangue(carte.majLe, langue) : null;
  const origine = `https://${site.adresse}`;
  const adresseFiche = `${origine}/lieux/${lieu.id}`;
  const filAriane = creerDonneesFilAriane([
    { nom: T.filAriane.accueil, adresse: `${origine}${lien("/")}` },
    { nom: lieu.nom, adresse: adresseFiche },
    { nom: T.filAriane.carte, adresse: `${adresseFiche}/carte` },
  ]);

  function basculerFiltre(filtre: FiltreCarte) {
    changerFiltres((actuels) => (actuels.includes(filtre) ? actuels.filter((un) => un !== filtre) : [...actuels, filtre]));
  }

  return (
    <div data-impression="carte-du-lieu" className="bg-creme py-9 md:pb-14 print:bg-white print:py-0">
      <DonneesStructurees donnees={filAriane} />
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-col gap-6">
        <EnTeteCarteEnGrand lieuId={lieu.id} nom={lieu.nom} logo={lieu.logo} titre={lieu.type === "sortie" ? T.titre.formules : T.titre.carte} date={date} />
        <NavRubriquesCarte rubriques={visibles} />
        {javascriptActif && (
          <FiltresCarte
            recherche={recherche}
            changerRecherche={changerRecherche}
            filtres={filtres}
            disponibles={listerFiltresCarte(rubriques)}
            basculerFiltre={basculerFiltre}
            toutAfficher={() => {
              changerRecherche("");
              changerFiltres([]);
            }}
            nombre={nombre}
          />
        )}
        {visibles.length > 0 ? (
          <div className="gap-6 md:columns-2 xl:columns-3 print:columns-2">
            {visibles.map((rubrique) => <RubriqueCarteEnGrand key={rubrique.id} rubrique={rubrique} />)}
          </div>
        ) : (
          <p className="rounded-carte border-2 border-dashed border-encre/40 bg-white px-6 py-10 text-center text-gris">{lierPonctuation(T.aucunResultat)}</p>
        )}
        <p className="text-[13px] text-gris">{lierPonctuation(T.piedDePage)}</p>
      </div>
    </div>
  );
}
