import type { Route } from "./+types/lieux";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";

import { MessageCarte } from "~/composants/carte-des-lieux/MessageCarte";
import { CarteLieu } from "~/composants/lieux/CarteLieu";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { CarteLieuxPleinEcran } from "~/composants/page-lieux/CarteLieuxPleinEcran";
import { ChoixVueLieux } from "~/composants/page-lieux/ChoixVueLieux";
import { EtatPageLieux } from "~/composants/page-lieux/EtatPageLieux";
import { FilArianeLieux } from "~/composants/page-lieux/FilArianeLieux";
import { FiltresTypes } from "~/composants/page-lieux/FiltresTypes";
import { FiltresVilles } from "~/composants/page-lieux/FiltresVilles";
import { PaginationLieux } from "~/composants/page-lieux/PaginationLieux";
import { PanneauCarteLieux } from "~/composants/page-lieux/PanneauCarteLieux";
import { RechercheLieux } from "~/composants/page-lieux/RechercheLieux";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_PAGE_LIEUX_PAR_LANGUE } from "~/contenus/page-lieux";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { ecrireAdresseLieux, type ParametresAdresseLieux } from "~/fonctions/page-lieux/ecrire-adresse-lieux";
import { ecrireIdentifiantVille } from "~/fonctions/page-lieux/ecrire-identifiant-ville";
import { lireFiltresLieux } from "~/fonctions/page-lieux/lire-filtres-lieux";
import { trouverVille } from "~/fonctions/page-lieux/trouver-ville";
import { creerDonneesFilAriane } from "~/fonctions/seo/creer-donnees-fil-ariane";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEcranLarge } from "~/hooks/utiliser-ecran-large";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { listerPageLieux, listerVillesLieux } from "~/services/page-lieux.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export async function loader({ request }: Route.LoaderArgs) {
  const filtres = lireFiltresLieux(new URL(request.url).searchParams);
  const { langue } = lireLangueRequete(request);
  const ip = lireIpVisiteur(request);
  const reponseVilles = await listerVillesLieux(ip);
  const villes = reponseVilles.ok ? reponseVilles.donnees : [];
  const villeChoisie = filtres.ville ? trouverVille(filtres.ville, villes) : null;
  const identifiantVille = villeChoisie ? ecrireIdentifiantVille(villeChoisie.ville) : filtres.ville;
  const nomVille = villeChoisie?.ville ?? filtres.ville;
  const liste = filtres.vue === "carte" ? null : await listerPageLieux({ ville: nomVille, type: filtres.type, recherche: filtres.recherche, page: filtres.page }, ip);
  const etat = !reponseVilles.ok && reponseVilles.erreur === "absente" ? "bientot" : liste && !liste.ok ? (liste.erreur === "absente" ? "bientot" : "indisponible") : "ok";
  const page = liste?.ok ? liste.donnees : null;
  return {
    filtres,
    villes,
    villeChoisie,
    identifiantVille,
    nomVille,
    page,
    etat,
    cheminCanonique: ecrireCheminLangue(ecrireAdresseLieux({ ville: identifiantVille, type: filtres.type, page: page?.page ?? filtres.page }), langue),
  } as const;
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_PAGE_LIEUX_PAR_LANGUE, langue);
  if (!loaderData) return creerMeta({ titre: T.titre, description: T.meta.description(null), langue });
  const { filtres, nomVille, page, etat } = loaderData;
  const balises = creerMeta({ titre: T.meta.titre(nomVille, filtres.type, page?.page ?? 1), description: T.meta.description(nomVille), langue });
  const sansIndex = filtres.recherche !== null || etat !== "ok" || (page !== null && page.total === 0);
  return sansIndex ? [...balises, { name: "robots", content: "noindex" }] : balises;
}

export default function PageLieux({ loaderData }: Route.ComponentProps) {
  const { filtres, villes, villeChoisie, identifiantVille, nomVille, page, etat, cheminCanonique } = loaderData;
  const T = utiliserTextes(TEXTES_PAGE_LIEUX_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const ecranLarge = utiliserEcranLarge();
  const base = { ville: identifiantVille, type: filtres.type, recherche: filtres.recherche };
  const adresse = (parametres: ParametresAdresseLieux) => lien(ecrireAdresseLieux(parametres));
  const adresseVille = (identifiant: string) => adresse({ ...base, ville: identifiant, vue: filtres.vue });

  if (filtres.vue === "carte") {
    return (
      <CarteLieuxPleinEcran
        ville={nomVille}
        type={filtres.type}
        villes={villes}
        lieuInitial={filtres.lieu}
        adresseFermer={adresse(base)}
        adresseType={(type) => adresse({ ...base, type, vue: "carte" })}
        adresseVille={adresseVille}
      />
    );
  }

  const origine = `https://${site.adresse}`;
  const filAriane = creerDonneesFilAriane([
    { nom: T.filAriane.accueil, adresse: `${origine}${lien("/")}` },
    { nom: T.filAriane.lieux, adresse: `${origine}${lien("/lieux")}` },
  ]);

  return (
    <div className="bg-creme pb-16">
      <DonneesStructurees donnees={filAriane} />
      <div className="mx-auto flex w-[min(1344px,100%-32px)] flex-col gap-5 pt-8 md:pt-10">
        <FilArianeLieux />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[clamp(2.25rem,5vw,3.4rem)] font-extrabold tracking-tight">{T.titre}</h1>
            <p className="max-w-2xl text-lg text-gris">{lierPonctuation(T.chapo(villeChoisie?.ville ?? null, villes.length))}</p>
          </div>
          <RechercheLieux ville={identifiantVille} type={filtres.type} recherche={filtres.recherche} />
        </div>
        <FiltresVilles villes={villes} villeChoisie={villeChoisie} identifiantVille={identifiantVille} type={filtres.type} recherche={filtres.recherche} />
        <FiltresTypes identifiantVille={identifiantVille} type={filtres.type} recherche={filtres.recherche} total={page?.total ?? null} />
        <ChoixVueLieux vue="liste" adresseListe={adresse({ ...base, page: filtres.page })} adresseCarte={adresse({ ...base, vue: "carte" })} className="lg:hidden" />
      </div>
      <div className="mx-auto mt-7 flex w-[min(1344px,100%-32px)] items-start gap-8">
        <section id="liste-des-lieux" tabIndex={-1} aria-labelledby="titre-liste-lieux" className="flex min-w-0 flex-1 flex-col gap-7">
          <h2 id="titre-liste-lieux" className="sr-only">{T.liste}</h2>
          {etat !== "ok" ? (
            <EtatPageLieux etat={etat} adresse={cheminCanonique} />
          ) : !page || page.lieux.length === 0 ? (
            <EtatPageLieux etat="aucun" recherche={filtres.recherche} />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {page.lieux.map((lieu) => (
                  <li key={lieu.id}>
                    <CarteLieu lieu={lieu} disposition="ligne" />
                  </li>
                ))}
              </ul>
              <PaginationLieux page={page.page} pages={page.pages} adressePage={(numero) => adresse({ ...base, page: numero })} />
            </>
          )}
        </section>
        {etat === "ok" && (
          <div className="hidden w-[420px] shrink-0 self-stretch lg:block xl:w-[520px] 2xl:w-[600px]">
            {ecranLarge ? (
              <PanneauCarteLieux
                ville={nomVille}
                type={filtres.type}
                villes={villes}
                adressePleinEcran={adresse({ ...base, vue: "carte" })}
                adresseVille={adresseVille}
              />
            ) : (
              <div className="sticky top-[88px] h-[calc(100dvh-112px)] max-h-[1040px] min-h-[520px] overflow-hidden rounded-carte border-2 border-encre bg-[#F4ECD8] shadow-brut">
                <MessageCarte etat="attente" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
