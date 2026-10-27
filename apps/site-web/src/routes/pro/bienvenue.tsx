import type { Route } from "./+types/bienvenue";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { CarteAtoutPro } from "~/composants/pro/CarteAtoutPro";
import { EMOJIS_ATOUTS_PRO, EMOJIS_BIENTOT_PRO, TEXTES_ESPACE_PRO_PAR_LANGUE } from "~/contenus/espace-pro";
import { ecrireAdresseSitePrincipal } from "~/fonctions/hotes/ecrire-adresse-site-principal";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireCompteConnecte } from "~/services/session-compte.server";

/** La seule page indexée de pro.sosmiam.fr (robots.txt, sitemap.xml). */
export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_ESPACE_PRO_PAR_LANGUE, langue);
  return creerMeta({ ...T.meta, langue });
}

/** Connecté, les boutons mènent au tableau plutôt qu'à l'inscription. */
export async function loader({ request }: Route.LoaderArgs) {
  return { connecte: (await lireCompteConnecte(request)) !== null };
}

/** Page /bienvenue (pro.sosmiam.fr/) : ce que l'espace pro apporte aux lieux, et comment commencer. */
export default function PageBienvenue({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_ESPACE_PRO_PAR_LANGUE);
  const inscrireMonLieu = ecrireAdresseSitePrincipal("/inscrire-mon-lieu", utiliserLangue());
  const boutons = loaderData.connecte ? (
    <Bouton vers="/tableau">{T.boutons.tableau}</Bouton>
  ) : (
    <>
      <Bouton vers="/inscription">{T.boutons.creerCompte}</Bouton>
      <Bouton vers="/connexion" variante="blanc">{T.boutons.connexion}</Bouton>
    </>
  );
  return (
    <>
      <Section fond="creme" className="!pt-10 md:!pt-16">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <p className="inline-block rounded-full bg-encre px-3.5 py-1.5 text-[.9rem] font-semibold text-jaune">{T.badge}</p>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-tight">{lierPonctuation(T.titre)}</h1>
            <p className="mt-4 max-w-xl text-lg text-gris">
              {lierPonctuation(T.chapo)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">{boutons}</div>
            <p className="mt-5 text-gris">
              <a href={inscrireMonLieu} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
                {T.boutons.pasSurSosMiam}
              </a>
              {lierPonctuation(T.inscrireEn3Minutes)}
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-sm rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut-grand">
            <span className="absolute -top-3.5 right-4 rounded-full bg-rouge-sos px-3 py-0.5 text-xs font-bold text-white">{T.gratuit.pourToujours}</span>
            <Mascotte expression="clin" className="mx-auto h-28 w-28" />
            <h2 className="mt-3 text-center text-3xl font-extrabold">{lierPonctuation(T.gratuit.titre)}</h2>
            <ul className="mt-4 grid gap-1.5 text-[.95rem] font-semibold">
              {T.gratuit.sans.map((sans) => <li key={sans}><span aria-hidden="true">✓ </span>{sans}</li>)}
            </ul>
            <p className="mt-4 text-sm">{lierPonctuation(T.gratuit.pub)}</p>
          </div>
        </div>
      </Section>

      <Section fond="blanc">
        <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight">{lierPonctuation(T.aujourdhui)}</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {T.atouts.map((atout, i) => <CarteAtoutPro key={atout.titre} atout={{ emoji: EMOJIS_ATOUTS_PRO[i] ?? "", ...atout }} />)}
        </ul>
        <h2 className="mt-16 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">{lierPonctuation(T.bientot.titre)}</h2>
        <p className="mt-2 max-w-xl text-gris">{lierPonctuation(T.bientot.texte)}</p>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {T.avecLApp.map((atout, i) => <CarteAtoutPro key={atout.titre} atout={{ emoji: EMOJIS_BIENTOT_PRO[i] ?? "", ...atout }} bientot={T.bientot.pastille} />)}
        </ul>
      </Section>

      <Section fond="jaune">
        <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight">{lierPonctuation(T.commentCaMarche)}</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {T.etapes.map((etape, position) => (
            <li key={etape} className="flex items-start gap-4 rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-encre font-titre text-lg font-extrabold text-jaune">
                {position + 1}
              </span>
              <span className="pt-1.5 font-semibold">{lierPonctuation(etape)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          {boutons}
          <Bouton href={inscrireMonLieu} variante="blanc">{T.boutons.pasSurSosMiam}</Bouton>
        </div>
      </Section>
    </>
  );
}
