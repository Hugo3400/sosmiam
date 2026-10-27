import { data } from "react-router";

import type { Route } from "./+types/fiche-lieu";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { carteContientAlcool } from "../../../../../packages/commun/src/fonctions/prevention/carte-contient-alcool.ts";
import { AutourDuLieu } from "~/composants/lieux/AutourDuLieu";
import { BandeauSos } from "~/composants/lieux/BandeauSos";
import { BarreActionsMobile } from "~/composants/lieux/BarreActionsMobile";
import { BlocAmbiance } from "~/composants/lieux/BlocAmbiance";
import { BlocBonASavoir } from "~/composants/lieux/BlocBonASavoir";
import { BlocCarteParRubriques } from "~/composants/lieux/BlocCarteParRubriques";
import { BlocCommentReserver } from "~/composants/lieux/BlocCommentReserver";
import { BlocHoraires } from "~/composants/lieux/BlocHoraires";
import { BlocLeLieu } from "~/composants/lieux/BlocLeLieu";
import { BlocPrevention } from "~/composants/lieux/BlocPrevention";
import { BlocSpecialites } from "~/composants/lieux/BlocSpecialites";
import { CarteDuLieuMini } from "~/composants/lieux/CarteDuLieuMini";
import { CarteNomLieu } from "~/composants/lieux/CarteNomLieu";
import { EncartCeLieuEstAToi } from "~/composants/lieux/EncartCeLieuEstAToi";
import { EncartDansLApp } from "~/composants/lieux/EncartDansLApp";
import { EnTeteFicheLieu } from "~/composants/lieux/EnTeteFicheLieu";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { site } from "~/contenus/legal/informations-legales";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerLienAppLieu } from "~/fonctions/liens-app/creer-lien-app-lieu";
import { decrireOuverture } from "~/fonctions/lieux/decrire-ouverture";
import { estFicheIndexable } from "~/fonctions/lieux/est-fiche-indexable";
import { lireIdLieu } from "~/fonctions/lieux/lire-id-lieu";
import { creerDonneesFilAriane } from "~/fonctions/seo/creer-donnees-fil-ariane";
import { creerDonneesLieu } from "~/fonctions/seo/creer-donnees-lieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { chargerFicheLieu } from "~/services/fiche-lieu.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

const DESCRIPTION_MAX = 155;

/** La fiche d'un lieu publié ; 404 (page introuvable) s'il n'existe pas, est en brouillon ou masqué. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { langue, negociee } = lireLangueRequete(request);
  const lieuId = lireIdLieu(params.id);
  if (lieuId === null) throw data(null, { status: 404 });
  const reponse = await chargerFicheLieu(lieuId, lireIpVisiteur(request));
  if (reponse.ok) {
    const fiche = { lieu: reponse.lieu, ouverture: decrireOuverture(reponse.lieu.ouverture, new Date()) };
    return data(fiche, { headers: { "Cache-Control": negociee ? "private, max-age=60" : "public, max-age=60" } });
  }
  if (reponse.erreur === "lieu-inconnu") throw data(null, { status: 404 });
  throw data(choisirTextes(TEXTES_FICHE_LIEU_PAR_LANGUE, langue).meta.indisponible, { status: 503 });
}

/** Indexée : titre « Nom à Ville », description tirée de la fiche ; l'adresse canonique est posée par le cadre public. */
export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_FICHE_LIEU_PAR_LANGUE, langue);
  if (!loaderData) return [{ title: T.meta.introuvable }, { name: "robots", content: "noindex" }];
  const { lieu } = loaderData;
  const resume = [lieu.info, lieu.quartier && `${lieu.quartier}, ${lieu.ville}`, lieu.texte].filter(Boolean).join(" · ");
  const description = resume.length > DESCRIPTION_MAX ? `${resume.slice(0, DESCRIPTION_MAX - 3).trimEnd()}…` : resume || T.meta.description(lieu.nom, lieu.ville);
  const balises = creerMeta({ titre: T.meta.titre(lieu.nom, lieu.ville), description, langue });
  return estFicheIndexable(lieu) ? balises : [...balises, { name: "robots", content: "noindex" }];
}

/** Une fiche se met à jour vite (le gérant la modifie) : une minute en cache, comme l'API. */
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return { "Cache-Control": loaderHeaders.get("Cache-Control") ?? "public, max-age=60" };
}

/**
 * Page /lieux/:id : la fiche publique d'un lieu, avec « Vérifié ✓ » ou « Lieu non vérifié », l'adresse et l'itinéraire,
 * les horaires, la présentation, la carte remplie par le lieu (avec le message sanitaire si elle a de l'alcool), les infos
 * pratiques (une info inconnue n'est pas affichée) et « Ce lieu est à toi ? ».
 */
export default function PageFicheLieu({ loaderData }: Route.ComponentProps) {
  const { lieu, ouverture } = loaderData;
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const origine = `https://${site.adresse}`;
  const adresseFiche = `${origine}/lieux/${lieu.id}`;
  const lienApp = creerLienAppLieu(lieu.id);
  const donnees = [
    creerDonneesLieu(lieu, adresseFiche),
    creerDonneesFilAriane([{ nom: T.filAriane.accueil, adresse: `${origine}${lien("/")}` }, { nom: lieu.nom, adresse: adresseFiche }]),
  ];
  return (
    <article className="bg-creme pb-16 md:pb-24">
      <DonneesStructurees donnees={donnees} />
      <EnTeteFicheLieu lieu={lieu} />
      <div className={`relative mx-auto flex w-[min(1120px,100%-32px)] flex-col gap-6 md:gap-7 ${lieu.banniere ? "-mt-10 md:-mt-[70px]" : "-mt-10 md:-mt-[60px]"}`}>
        <CarteNomLieu lieu={lieu} ouverture={ouverture} adresseFiche={adresseFiche} />
        {lieu.sos && <BandeauSos sos={lieu.sos} lienApp={lienApp} />}
        <div className="grid items-start gap-6 md:gap-7 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex min-w-0 flex-col gap-6 md:gap-7">
            {lieu.type === "sortie" && <BlocCommentReserver lieu={lieu} />}
            {lieu.type === "patisserie" && <BlocSpecialites carte={lieu.carte} />}
            {lieu.type === "patisserie" && lieu.horaires?.trim() && <BlocHoraires horaires={lieu.horaires} />}
            <BlocLeLieu lieu={lieu} />
            {lieu.type === "bar" && <BlocAmbiance etiquettes={lieu.etiquettes ?? []} />}
            {/* La carte remplie par le lieu ; avec de l'alcool, le message sanitaire suit, juste dessous */}
            {lieu.carte && <BlocCarteParRubriques carte={lieu.carte} type={lieu.type} lieuId={lieu.id} />}
            {/* Un bar sert de l'alcool : message sanitaire (loi Évin) et aide, décidé par Hugo le 9 octobre 2026 (une seule
                fois sur la page : s'il est déjà sous la carte, il n'est pas répété) */}
            {lieu.type === "bar" && !carteContientAlcool(lieu.carte) && <BlocPrevention />}
            <BlocBonASavoir infos={lieu} />
          </div>
          <div className="flex min-w-0 flex-col gap-6 md:gap-7">
            {lieu.type !== "patisserie" && lieu.horaires?.trim() && <BlocHoraires horaires={lieu.horaires} />}
            <CarteDuLieuMini lieu={lieu} />
            <EncartDansLApp lienApp={lienApp} />
            <EncartCeLieuEstAToi lieu={lieu} adresseFiche={adresseFiche} />
          </div>
        </div>
        <AutourDuLieu lieux={lieu.autour ?? []} type={lieu.type} />
      </div>
      <BarreActionsMobile lieu={lieu} adresseFiche={adresseFiche} lienApp={lienApp} />
    </article>
  );
}
