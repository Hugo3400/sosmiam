import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Link } from "react-router";

import type { Route } from "./+types/kit-media";
import { Bouton } from "~/composants/interface/Bouton";
import { CarteFichierKit } from "~/composants/kit-media/CarteFichierKit";
import { EtapesKit } from "~/composants/kit-media/EtapesKit";
import { NuancierKit } from "~/composants/kit-media/NuancierKit";
import { PolicesKit } from "~/composants/kit-media/PolicesKit";
import { ReglesKit } from "~/composants/kit-media/ReglesKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import { TexteAPoster } from "~/composants/kit-media/TexteAPoster";
import {
  DOSSIER_KIT_MEDIA, NOM_ZIP_KIT_MEDIA, dossiersKitMedia, fichiersKitMedia, textesKitMedia, visuelsKitMedia, type DossierKit,
} from "~/contenus/kit-media";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerAmbassadeurActif } from "~/services/session-compte.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Ton kit média — SOS Miam" }, { name: "robots", content: "noindex" }];
}

export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

const nombres = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** « 160 Ko », « 1,8 Mo » : le poids d'un fichier, pour savoir ce qu'on télécharge (sur mobile surtout). */
function lirePoids(octets: number): string {
  return octets < 1_000_000 ? `${Math.max(1, Math.round(octets / 1000))} Ko` : `${nombres.format(octets / 1_000_000)} Mo`;
}

/** Réservée aux ambassadeurs validés. Le poids de chaque fichier est lu sur le disque (null s'il manque). */
export async function loader({ request }: Route.LoaderArgs) {
  await exigerAmbassadeurActif(request);
  const lus = await Promise.all(
    fichiersKitMedia.map(async (fichier) => {
      const infos = await stat(join(process.cwd(), DOSSIER_KIT_MEDIA, fichier.chemin)).catch(() => null);
      return [fichier.nom, infos ? lirePoids(infos.size) : null] as const;
    }),
  );
  return { poids: Object.fromEntries(lus) as Record<string, string | null> };
}

/** Page /espace/kit-media : le kit média des ambassadeurs (visuels, textes prêts à poster, logos, couleurs, règles). */
export default function PageKitMedia({ loaderData }: Route.ComponentProps) {
  const { poids } = loaderData;
  const poidsZip = poids[NOM_ZIP_KIT_MEDIA];
  // Les visuels à poster d'abord, puis les textes, puis les dessins de la marque (logos, mascotte, badges)
  const visuels = dossiersKitMedia.filter((famille) => famille.dossier === "visuels");
  const dessins = dossiersKitMedia.filter((famille) => famille.dossier !== "visuels");
  const cartes = (dossier: DossierKit) =>
    visuelsKitMedia.filter((visuel) => visuel.dossier === dossier).map((visuel) => <CarteFichierKit key={visuel.id} visuel={visuel} poids={poids} />);

  return (
    <article className="mx-auto w-[min(1120px,100%-32px)] py-10 md:py-14">
      <Link to="/espace" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre">
        <span aria-hidden="true">←</span> Mon espace
      </Link>
      <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold tracking-tight">Ton kit média</h1>
      <p className="mt-3 max-w-2xl text-lg text-gris">
        {lierPonctuation("Des visuels prêts à poster, des textes à copier, nos logos et notre mascotte : tout ce qu'il faut pour parler de SOS Miam autour de toi. Un œil sur les règles avant de poster, en bas de la page, et c'est parti !")}
      </p>

      <SectionKit id="comment-ca-marche" titre="Comment ça marche ?">
        <EtapesKit />
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
          <p className="flex-1 font-semibold">{lierPonctuation("Tout le kit d'un coup : images, logos, mascotte, badges et les règles, dans un seul fichier.")}</p>
          <Bouton href={`/kit-media/${NOM_ZIP_KIT_MEDIA}`} variante="blanc">
            Tout télécharger{poidsZip ? ` (ZIP, ${poidsZip})` : " (ZIP)"}
          </Bouton>
        </div>
      </SectionKit>

      {visuels.map((famille) => (
        <SectionKit key={famille.dossier} id={famille.dossier} titre={famille.titre} texte={famille.texte}>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cartes(famille.dossier)}</ul>
        </SectionKit>
      ))}

      <SectionKit id="textes" titre="Les textes prêts à poster" texte="Copie, colle, poste : le lien et #SOSMiam sont déjà dedans. Tu peux aussi les changer à ta sauce.">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {textesKitMedia.map((texte) => <TexteAPoster key={texte.titre} titre={texte.titre} texte={texte.texte} />)}
        </ul>
      </SectionKit>

      {dessins.map((famille) => (
        <SectionKit key={famille.dossier} id={famille.dossier} titre={famille.titre} texte={famille.texte}>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cartes(famille.dossier)}</ul>
        </SectionKit>
      ))}

      <SectionKit id="couleurs" titre="Les couleurs">
        <NuancierKit />
      </SectionKit>

      <SectionKit id="polices" titre="Les polices" texte="Gratuites, à installer si tu fais tes propres visuels.">
        <PolicesKit />
      </SectionKit>

      <SectionKit id="regles" titre="Les règles du kit" texte="Le kit sert à parler de SOS Miam, en ton nom, comme ambassadeur. Quelques règles pour que ça reste juste et sympa pour tout le monde.">
        <ReglesKit />
      </SectionKit>
    </article>
  );
}
