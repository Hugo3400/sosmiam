import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Link } from "react-router";

import type { Route } from "./+types/kit-media";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { CarteFichierKit } from "~/composants/kit-media/CarteFichierKit";
import { EtapesKit } from "~/composants/kit-media/EtapesKit";
import { NuancierKit } from "~/composants/kit-media/NuancierKit";
import { PolicesKit } from "~/composants/kit-media/PolicesKit";
import { ReglesKit } from "~/composants/kit-media/ReglesKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import { SectionsMaquettesKit } from "~/composants/kit-media/SectionsMaquettesKit";
import { TexteAPoster } from "~/composants/kit-media/TexteAPoster";
import {
  DOSSIER_KIT_MEDIA, LIEN_KIT_MEDIA, NOM_ZIP_KIT_MEDIA, TEXTES_KIT_MEDIA_PAR_LANGUE, fichiersKitMedia, visuelsKitMedia, type DossierKit,
} from "~/contenus/kit-media";
import { ecrirePoidsFichier } from "~/fonctions/kits/ecrire-poids-fichier";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { lirePoidsMaquettes } from "~/services/maquettes-kits.server";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: choisirTextes(TEXTES_KIT_MEDIA_PAR_LANGUE, lireLangueMeta(matches)).meta.titre }, { name: "robots", content: "noindex" }];
}

export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

/** Réservée aux ambassadeurs validés. Le poids de chaque fichier est lu sur le disque (null s'il manque). */
export async function loader({ request }: Route.LoaderArgs) {
  await exigerAmbassadeurActif(request);
  const { langue } = lireLangueRequete(request);
  const [lus, maquettes] = await Promise.all([
    Promise.all(
      fichiersKitMedia.map(async (fichier) => {
        const infos = await stat(join(process.cwd(), DOSSIER_KIT_MEDIA, fichier.chemin)).catch(() => null);
        return [fichier.nom, infos ? ecrirePoidsFichier(infos.size, langue) : null] as const;
      }),
    ),
    lirePoidsMaquettes("ambassadeurs", true, langue),
  ]);
  return { poids: { ...maquettes, ...Object.fromEntries(lus) } as Record<string, string | null> };
}

/** Page /espace/kit-media : le kit média des ambassadeurs (visuels, textes prêts à poster, logos, couleurs, règles). */
export default function PageKitMedia({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_KIT_MEDIA_PAR_LANGUE);
  const { poids } = loaderData;
  const dossiersKitMedia = (["visuels", "logos", "mascotte", "badges"] as const).map((dossier) => ({ dossier, ...T.dossiers[dossier] }));
  const visuelsTraduits = visuelsKitMedia.map((visuel) => ({ ...visuel, ...T.visuels[visuel.id] }));
  const poidsZip = poids[NOM_ZIP_KIT_MEDIA];
  // Les visuels à poster d'abord, puis les textes, puis les dessins de la marque (logos, mascotte, badges)
  const visuels = dossiersKitMedia.filter((famille) => famille.dossier === "visuels");
  const dessins = dossiersKitMedia.filter((famille) => famille.dossier !== "visuels");
  const cartes = (dossier: DossierKit) =>
    visuelsTraduits.filter((visuel) => visuel.dossier === dossier).map((visuel) => <CarteFichierKit key={visuel.id} visuel={visuel} poids={poids} />);

  return (
    <article className="mx-auto w-[min(1120px,100%-32px)] py-10 md:py-14">
      <Link to="/espace" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre">
        <span aria-hidden="true">←</span> {T.page.retour}
      </Link>
      <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-tight">{T.page.titre}</h1>
      <p className="mt-3 max-w-2xl text-lg text-gris">
        {lierPonctuation(T.page.introDebut)}
        <a href="#regles" className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          {T.page.lienRegles}
        </a>
        {lierPonctuation(T.page.introFin)}
      </p>

      <SectionKit id="comment-ca-marche" titre={T.page.commentCaMarche}>
        <EtapesKit />
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
          <p className="flex-1 font-semibold">{lierPonctuation(T.page.toutDUnCoup)}</p>
          <Bouton href={`/kit-media/${NOM_ZIP_KIT_MEDIA}`} variante="blanc">
            {T.page.toutTelecharger(poidsZip)}
          </Bouton>
        </div>
      </SectionKit>

      {visuels.map((famille) => (
        <SectionKit key={famille.dossier} id={famille.dossier} titre={famille.titre} texte={famille.texte}>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cartes(famille.dossier)}</ul>
        </SectionKit>
      ))}

      {/* Les maquettes validées : affiches (A4, A3, 40 × 60 cm), imprimés, carrousels et stories */}
      <SectionsMaquettesKit kit="ambassadeurs" prefixe="/kit-media" poids={poids} />

      <SectionKit id="textes" titre={T.page.titreTextes} texte={T.page.texteTextes}>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {T.textes.map((texte) => <TexteAPoster key={texte.titre} titre={texte.titre} texte={texte.texte(LIEN_KIT_MEDIA)} />)}
        </ul>
      </SectionKit>

      {dessins.map((famille) => (
        <SectionKit key={famille.dossier} id={famille.dossier} titre={famille.titre} texte={famille.texte}>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cartes(famille.dossier)}</ul>
        </SectionKit>
      ))}

      <SectionKit id="couleurs" titre={T.page.couleurs}>
        <NuancierKit />
      </SectionKit>

      <SectionKit id="polices" titre={T.page.polices} texte={T.page.textePolices}>
        <PolicesKit />
      </SectionKit>

      <SectionKit id="regles" titre={T.page.regles} texte={T.page.texteRegles}>
        <ReglesKit />
      </SectionKit>
    </article>
  );
}
