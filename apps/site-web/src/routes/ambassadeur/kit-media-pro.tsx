import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Link, redirect } from "react-router";

import type { Route } from "./+types/kit-media-pro";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { ReglesKit } from "~/composants/kit-media/ReglesKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import { SectionsMaquettesKit } from "~/composants/kit-media/SectionsMaquettesKit";
import { CarteFichiersKitPro } from "~/composants/kit-media-pro/CarteFichiersKitPro";
import { TexteKitPro } from "~/composants/kit-media-pro/TexteKitPro";
// Les textes et la liste des fichiers seulement : jamais les dessins de l'affiche et du flyer (composants/kit-media-pro/
// AfficheA4…), ni leur QR code, calculé par uqr, une dépendance de développement absente en ligne
import {
  DOSSIER_KIT_MEDIA_PRO, EMAIL_CONTACT_KIT_PRO, LIEN_INSCRIRE_LIEU, NOM_ZIP_KIT_MEDIA_PRO, TEXTES_KIT_MEDIA_PRO_PAR_LANGUE, fichiersKitMediaPro,
  formatsImpression, type IdVisuelKitPro, type TEXTES_KIT_MEDIA_PRO,
} from "~/contenus/kit-media-pro";
import { ecrirePoidsFichier } from "~/fonctions/kits/ecrire-poids-fichier";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { lirePoidsMaquettes } from "~/services/maquettes-kits.server";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

export function meta({ matches }: Route.MetaArgs) {
  return [{ title: choisirTextes(TEXTES_KIT_MEDIA_PRO_PAR_LANGUE, lireLangueMeta(matches)).meta.titre }, { name: "robots", content: "noindex" }];
}

export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

/** Réservée aux ambassadeurs certifiés (les autres vont à /espace/certification). Le poids de chaque fichier est lu sur le disque. */
export async function loader({ request }: Route.LoaderArgs) {
  const { compte } = await exigerAmbassadeurActif(request);
  if (!compte.ambassadeur?.certifie) throw redirect("/espace/certification");
  const { langue } = lireLangueRequete(request);
  const [lus, maquettes] = await Promise.all([
    Promise.all(
      fichiersKitMediaPro.map(async (fichier) => {
        const infos = await stat(join(process.cwd(), DOSSIER_KIT_MEDIA_PRO, fichier.chemin)).catch(() => null);
        return [fichier.nom, infos ? ecrirePoidsFichier(infos.size, langue) : null] as const;
      }),
    ),
    lirePoidsMaquettes("pro", true, langue),
  ]);
  return { poids: { ...maquettes, ...Object.fromEntries(lus) } as Record<string, string | null> };
}

const { A4, A6 } = formatsImpression;

function listerCartes(T: Traduction<typeof TEXTES_KIT_MEDIA_PRO>) {
  const description = (id: IdVisuelKitPro) => T.visuels[id].description;
  return [
    {
      ...T.cartes.affiche,
      apercus: [{ nom: "affiche-a4.png", description: description("affiche-a4"), largeur: A4.largeur, hauteur: A4.hauteur }],
      fichiers: fichiersKitMediaPro.filter((fichier) => fichier.visuel === "affiche-a4"),
    },
    {
      ...T.cartes.flyer,
      apercus: [
        { nom: "flyer-a6-recto.png", description: description("flyer-a6-recto"), largeur: A6.largeur, hauteur: A6.hauteur },
        { nom: "flyer-a6-verso.png", description: description("flyer-a6-verso"), largeur: A6.largeur, hauteur: A6.hauteur },
      ],
      fichiers: fichiersKitMediaPro.filter((fichier) => fichier.visuel?.startsWith("flyer-a6")),
    },
    {
      ...T.cartes.miamSafe,
      apercus: [{ nom: "affiche-miam-safe-a4.png", description: description("affiche-miam-safe-a4"), largeur: A4.largeur, hauteur: A4.hauteur }],
      fichiers: fichiersKitMediaPro.filter((fichier) => fichier.visuel === "affiche-miam-safe-a4"),
    },
  ];
}

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre";

/** Page /espace/kit-media-pro : l'affiche, le flyer, le mot de 30 secondes, le mail type et les règles du kit pro. */
export default function PageKitMediaPro({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_KIT_MEDIA_PRO_PAR_LANGUE);
  const cartes = listerCartes(T);
  const { poids } = loaderData;
  const poidsZip = poids[NOM_ZIP_KIT_MEDIA_PRO];
  return (
    <article className="mx-auto w-[min(1120px,100%-32px)] py-10 md:py-14">
      <Link to="/espace" className={classeLien}>
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

      <SectionKit id="comment-t-en-servir" titre={T.page.commentTEnServir}>
        <ol className="grid gap-3">
          {T.usage.map((etape, position) => (
            <li key={etape} className="flex items-start gap-3">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune font-titre font-extrabold">
                {position + 1}
              </span>
              <span className="pt-0.5">{lierPonctuation(etape)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
          <p className="flex-1 basis-60 font-semibold">{lierPonctuation(T.page.toutDUnCoup)}</p>
          <Bouton href={`/kit-media-pro/${NOM_ZIP_KIT_MEDIA_PRO}`} variante="blanc">
            {T.page.toutTelecharger(poidsZip)}
          </Bouton>
        </div>
      </SectionKit>

      <SectionKit id="affiche-et-flyer" titre={T.page.titreFichiers} texte={T.page.texteFichiers}>
        <ul className="grid gap-5 md:grid-cols-2">
          {cartes.map((carte) => <CarteFichiersKitPro key={carte.titre} {...carte} poids={poids} />)}
        </ul>
      </SectionKit>

      <SectionKit id="carte-de-visite" titre={T.page.titreCarteDeVisite} texte={T.page.texteCarteDeVisite}>
        <Link to="/espace/carte-de-visite" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre">
          {T.page.ouvrirCarteDeVisite}
        </Link>
      </SectionKit>

      {/* Les maquettes validées à laisser aux lieux : l'affiche de vitrine (A4, A3, 40 × 60 cm) et le flyer grand public */}
      <SectionsMaquettesKit kit="pro" prefixe="/kit-media-pro" poids={poids} />

      <SectionKit id="textes" titre={T.page.titreTextes} texte={T.page.texteTextes}>
        <ul className="grid gap-5 lg:grid-cols-2">
          <TexteKitPro titre={T.motComptoir.titre} texte={T.motComptoir.texte} conseils={T.motComptoir.conseils} />
          <TexteKitPro
            titre={T.mailType.titre}
            objet={T.mailType.objet}
            texte={T.mailType.texte(LIEN_INSCRIRE_LIEU, EMAIL_CONTACT_KIT_PRO)}
            conseils={T.mailType.conseils}
          />
        </ul>
      </SectionKit>

      <SectionKit id="regles" titre={T.page.titreRegles} texte={T.page.texteRegles}>
        <ReglesKit regles={T.regles} />
      </SectionKit>
    </article>
  );
}
