import { Form, redirect } from "react-router";

import type { Route } from "./+types/statistiques";
import { Bouton } from "~/composants/interface/Bouton";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { aRefuseStatistiques, aSignalAntiSuivi, creerCookieRefus } from "~/services/mesure.server";

export function meta(_: Route.MetaArgs) {
  return creerMeta({
    titre: "Tes visites et nos statistiques",
    description: "Comment SOS Miam compte ses visites sans cookie ni pistage, et comment ne plus être compté en un clic.",
  });
}

export function loader({ request }: Route.LoaderArgs) {
  return { refus: aRefuseStatistiques(request), signalNavigateur: aSignalAntiSuivi(request) };
}

/** Enregistre le choix (cookie de refus, ou son effacement), puis revient sur la page. */
export async function action({ request }: Route.ActionArgs) {
  const choix = (await request.formData()).get("choix");
  return redirect("/statistiques", { headers: { "Set-Cookie": creerCookieRefus(choix === "refuser") } });
}

/** Page /statistiques : ce qu'on compte, et le bouton pour ne plus compter ses visites (droit d'opposition). */
export default function PageStatistiques({ loaderData }: Route.ComponentProps) {
  const { refus, signalNavigateur } = loaderData;
  const compte = !refus && !signalNavigateur;
  return (
    <article className="mx-auto w-[min(760px,100%-32px)] py-12 md:py-16">
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">Tes visites et nos statistiques</h1>
      <div className="mt-8 grid gap-4 text-lg">
        <p>
          Pour savoir si SOS Miam plaît (combien de visites, quelles pages, d'où l'on vient), notre serveur compte les pages vues
          lui-même. <strong>Pas de cookie de mesure, pas de script espion, pas de Google Analytics</strong> : on ne garde que des
          totaux, jamais ton adresse IP ni rien qui permette de te reconnaître.
        </p>
        <p className="text-gris">
          Tous les détails sont dans la <a href="/confidentialite#statistiques" className="underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">politique de confidentialité</a>.
        </p>
      </div>

      <section aria-labelledby="ton-choix" className="mt-10 rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
        <h2 id="ton-choix" className="text-2xl font-extrabold">{compte ? "Tes visites sont comptées" : "Tes visites ne sont pas comptées"}</h2>
        <p className="mt-3 text-gris">
          {signalNavigateur
            ? "Ton navigateur demande à ne pas être suivi (signal « Global Privacy Control » ou « Do Not Track ») : on respecte, tu n'es pas compté. Rien d'autre à faire."
            : refus
              ? "C'est noté : un petit cookie retient ton choix pendant 13 mois dans ce navigateur. Il ne sert qu'à ça. Si tu effaces tes cookies, il faudra refaire ton choix."
              : "Tu préfères ne pas être compté, même anonymement ? Un clic suffit. On garde ton choix 13 mois dans un petit cookie qui ne sert qu'à ça."}
        </p>
        {!signalNavigateur && (
          <Form method="post" className="mt-5">
            <input type="hidden" name="choix" value={refus ? "accepter" : "refuser"} />
            <Bouton type="submit" variante={refus ? "jaune" : "blanc"}>
              {refus ? "Compter à nouveau mes visites" : "Ne plus compter mes visites"}
            </Bouton>
          </Form>
        )}
      </section>
    </article>
  );
}
