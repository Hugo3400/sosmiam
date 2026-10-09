import type { Route } from "./+types/bienvenue";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { CarteAtoutPro } from "~/composants/pro/CarteAtoutPro";
import { atoutsPro, bientotPro, etapesPro } from "~/contenus/espace-pro";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { lireCompteConnecte } from "~/services/session-compte.server";

const INSCRIRE_MON_LIEU = "https://sosmiam.fr/inscrire-mon-lieu";

/** La seule page indexée de pro.sosmiam.fr (robots.txt, sitemap.xml). */
export function meta(_: Route.MetaArgs) {
  return creerMeta({
    titre: "L'espace pro",
    description: "SOS Miam pro : ta fiche à jour, tes infos pratiques, les suggestions des clients, ton équipe et ton affichette de table. Gratuit, sans abonnement ni commission.",
  });
}

/** Connecté, les boutons mènent au tableau plutôt qu'à l'inscription. */
export async function loader({ request }: Route.LoaderArgs) {
  return { connecte: (await lireCompteConnecte(request)) !== null };
}

/** Page /bienvenue (pro.sosmiam.fr/) : ce que l'espace pro apporte aux lieux, et comment commencer. */
export default function PageBienvenue({ loaderData }: Route.ComponentProps) {
  const boutons = loaderData.connecte ? (
    <Bouton vers="/tableau">Aller à mon tableau</Bouton>
  ) : (
    <>
      <Bouton vers="/inscription">Créer mon compte</Bouton>
      <Bouton vers="/connexion" variante="blanc">Me connecter</Bouton>
    </>
  );
  return (
    <>
      <Section fond="creme" className="!pt-10 md:!pt-16">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <p className="inline-block rounded-full bg-encre px-3.5 py-1.5 text-[.9rem] font-semibold text-jaune">Pour les restos, bars, pâtisseries et sorties</p>
            <h1 className="mt-5 text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-tight">{lierPonctuation("Ton lieu, ta fiche, tes gourmands.")}</h1>
            <p className="mt-4 max-w-xl text-lg text-gris">
              {lierPonctuation("L'espace pro de SOS Miam, c'est là où tu tiens ta fiche à jour, où tu vois ce que les clients te suggèrent et où tu invites ton équipe. Le tout sans payer un centime.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">{boutons}</div>
            <p className="mt-5 text-gris">
              <a href={INSCRIRE_MON_LIEU} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
                Mon lieu n'est pas sur SOS Miam
              </a>
              {lierPonctuation(" : inscris-le en 3 minutes.")}
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-sm rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut-grand">
            <span className="absolute -top-3.5 right-4 rounded-full bg-rouge-sos px-3 py-0.5 text-xs font-bold text-white">Pour toujours</span>
            <Mascotte expression="clin" className="mx-auto h-28 w-28" />
            <h2 className="mt-3 text-center text-3xl font-extrabold">{lierPonctuation("C'est gratuit")}</h2>
            <ul className="mt-4 grid gap-1.5 text-[.95rem] font-semibold">
              <li><span aria-hidden="true">✓ </span>Sans abonnement</li>
              <li><span aria-hidden="true">✓ </span>Sans engagement</li>
              <li><span aria-hidden="true">✓ </span>Sans commission</li>
            </ul>
            <p className="mt-4 text-sm">{lierPonctuation("SOS Miam vit de la pub, toujours signalée, qui ne change jamais le classement.")}</p>
          </div>
        </div>
      </Section>

      <Section fond="blanc">
        <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight">{lierPonctuation("Ce que tu peux faire dès aujourd'hui")}</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {atoutsPro.map((atout) => <CarteAtoutPro key={atout.titre} atout={atout} />)}
        </ul>
        <h2 className="mt-16 text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-tight">{lierPonctuation("Et bientôt, avec l'app")}</h2>
        <p className="mt-2 max-w-xl text-gris">{lierPonctuation("Ça arrive avec l'app SOS Miam. On te prévient dès que c'est prêt.")}</p>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bientotPro.map((atout) => <CarteAtoutPro key={atout.titre} atout={atout} bientot />)}
        </ul>
      </Section>

      <Section fond="jaune">
        <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight">{lierPonctuation("Comment ça marche ?")}</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {etapesPro.map((etape, position) => (
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
          <Bouton href={INSCRIRE_MON_LIEU} variante="blanc">Mon lieu n'est pas sur SOS Miam</Bouton>
        </div>
      </Section>
    </>
  );
}
