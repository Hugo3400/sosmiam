import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Link, redirect } from "react-router";

import type { Route } from "./+types/kit-media-pro";
import { Bouton } from "~/composants/interface/Bouton";
import { ReglesKit } from "~/composants/kit-media/ReglesKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import { CarteFichiersKitPro } from "~/composants/kit-media-pro/CarteFichiersKitPro";
import { TexteKitPro } from "~/composants/kit-media-pro/TexteKitPro";
// Les textes et la liste des fichiers seulement : jamais les dessins de l'affiche et du flyer (composants/kit-media-pro/
// AfficheA4…), ni leur QR code, calculé par uqr, une dépendance de développement absente en ligne
import {
  DOSSIER_KIT_MEDIA_PRO, NOM_ZIP_KIT_MEDIA_PRO, fichiersKitMediaPro, formatsImpression, mailType, motComptoir, reglesKitMediaPro,
  usageKitMediaPro, visuelsKitMediaPro,
} from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Ton kit média pro — SOS Miam" }, { name: "robots", content: "noindex" }];
}

export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

const nombres = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** « 160 Ko », « 1,1 Mo » : le poids d'un fichier, pour savoir ce qu'on télécharge (sur mobile surtout). */
function lirePoids(octets: number): string {
  return octets < 1_000_000 ? `${Math.max(1, Math.round(octets / 1000))} Ko` : `${nombres.format(octets / 1_000_000)} Mo`;
}

/** Réservée aux ambassadeurs certifiés (les autres vont à /espace/certification). Le poids de chaque fichier est lu sur le disque. */
export async function loader({ request }: Route.LoaderArgs) {
  const { compte } = await exigerAmbassadeurActif(request);
  if (!compte.ambassadeur?.certifie) throw redirect("/espace/certification");
  const lus = await Promise.all(
    fichiersKitMediaPro.map(async (fichier) => {
      const infos = await stat(join(process.cwd(), DOSSIER_KIT_MEDIA_PRO, fichier.chemin)).catch(() => null);
      return [fichier.nom, infos ? lirePoids(infos.size) : null] as const;
    }),
  );
  return { poids: Object.fromEntries(lus) as Record<string, string | null> };
}

const description = (id: string) => visuelsKitMediaPro.find((visuel) => visuel.id === id)?.description ?? "";
const { A4, A6 } = formatsImpression;
const cartes = [
  {
    titre: "L'affiche A4",
    texte: "« Ton lieu sur SOS Miam, c'est gratuit », avec un QR code vers « J'inscris mon lieu ». Au comptoir, en vitrine, ou à laisser au lieu.",
    apercus: [{ nom: "affiche-a4.png", description: description("affiche-a4"), largeur: A4.largeur, hauteur: A4.hauteur }],
    fichiers: fichiersKitMediaPro.filter((fichier) => fichier.visuel === "affiche-a4"),
  },
  {
    titre: "Le flyer A6 recto verso",
    texte: "Au recto, ce que SOS Miam apporte à un lieu ; au verso, comment s'inscrire, gratuit et sans abonnement.",
    apercus: [
      { nom: "flyer-a6-recto.png", description: description("flyer-a6-recto"), largeur: A6.largeur, hauteur: A6.hauteur },
      { nom: "flyer-a6-verso.png", description: description("flyer-a6-verso"), largeur: A6.largeur, hauteur: A6.hauteur },
    ],
    fichiers: fichiersKitMediaPro.filter((fichier) => fichier.visuel?.startsWith("flyer-a6")),
  },
];

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre";

/** Page /espace/kit-media-pro : l'affiche, le flyer, le mot de 30 secondes, le mail type et les règles du kit pro. */
export default function PageKitMediaPro({ loaderData }: Route.ComponentProps) {
  const { poids } = loaderData;
  const poidsZip = poids[NOM_ZIP_KIT_MEDIA_PRO];
  return (
    <article className="mx-auto w-[min(1120px,100%-32px)] py-10 md:py-14">
      <Link to="/espace" className={classeLien}>
        <span aria-hidden="true">←</span> Mon espace
      </Link>
      <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-tight">Ton kit média pro</h1>
      <p className="mt-3 max-w-2xl text-lg text-gris">
        {lierPonctuation("De quoi présenter SOS Miam aux lieux du coin, en ambassadeur certifié : une affiche, un flyer, un mot à dire au comptoir et un mail type. Un œil sur ")}
        <a href="#regles" className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          les règles
        </a>
        {lierPonctuation(" avant d'y aller, et bonne tournée !")}
      </p>

      <SectionKit id="comment-t-en-servir" titre="Comment t'en servir ?">
        <ol className="grid gap-3">
          {usageKitMediaPro.map((etape, position) => (
            <li key={etape} className="flex items-start gap-3">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune font-titre font-extrabold">
                {position + 1}
              </span>
              <span className="pt-0.5">{lierPonctuation(etape)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
          <p className="flex-1 basis-60 font-semibold">{lierPonctuation("Tout le kit pro d'un coup : l'affiche, le flyer, les textes et les règles, dans un seul fichier.")}</p>
          <Bouton href={`/kit-media-pro/${NOM_ZIP_KIT_MEDIA_PRO}`} variante="blanc">
            Tout télécharger{poidsZip ? ` (ZIP, ${poidsZip})` : " (ZIP)"}
          </Bouton>
        </div>
      </SectionKit>

      <SectionKit id="affiche-et-flyer" titre="L'affiche et le flyer" texte="En PDF pour imprimer, en PNG pour les montrer à l'écran.">
        <ul className="grid gap-5 md:grid-cols-2">
          {cartes.map((carte) => <CarteFichiersKitPro key={carte.titre} {...carte} poids={poids} />)}
        </ul>
      </SectionKit>

      <SectionKit id="textes" titre="Les mots pour le dire" texte="Copie, adapte avec tes mots à toi, et c'est parti. Tout ce qui est entre crochets est à remplacer.">
        <ul className="grid gap-5 lg:grid-cols-2">
          <TexteKitPro titre={motComptoir.titre} texte={motComptoir.texte} conseils={motComptoir.conseils} />
          <TexteKitPro titre={mailType.titre} objet={mailType.objet} texte={mailType.texte} conseils={mailType.conseils} />
        </ul>
      </SectionKit>

      <SectionKit id="regles" titre="Les règles du kit pro" texte="Tu parles en ton nom, comme ambassadeur certifié : quelques règles pour que ça reste juste pour les lieux, et pour toi.">
        <ReglesKit regles={reglesKitMediaPro} />
      </SectionKit>
    </article>
  );
}
