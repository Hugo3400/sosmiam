import { data, Form } from "react-router";

import type { Route } from "./+types/desinscription";
import { Bouton } from "~/composants/interface/Bouton";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { desinscrireNewsletter, lireDesinscription } from "~/services/desinscription.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

/**
 * /desinscription?jeton=… : le lien « Me désinscrire » des mails de la newsletter (services/liens-desinscription.ts de
 * l'API). Ouvrir le lien ne désinscrit PAS (les antivirus des messageries ouvrent les liens tout seuls) : la page montre
 * l'adresse masquée et un bouton, un formulaire POST qui marche sans JavaScript. Jamais en cache, jamais indexée
 * (robots.txt la ferme aussi), et sans « Referer » : le jeton ne part pas vers un autre site.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const jeton = new URL(request.url).searchParams.get("jeton");
  const lecture = await lireDesinscription(jeton, lireIpVisiteur(request));
  // Le bouton reste là si l'API n'a pas pu lire le lien (trop d'essais, panne) : seul un lien faux le retire
  const garde = lecture.ok || lecture.erreur !== "jeton-invalide";
  return data({ jeton: garde ? jeton : null, lecture }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request }: Route.ActionArgs) {
  const champ = (await request.formData()).get("jeton");
  const resultat = await desinscrireNewsletter(typeof champ === "string" ? champ : null, lireIpVisiteur(request));
  return data({ resultat }, { status: resultat === "ok" ? 200 : resultat === "jeton-invalide" ? 400 : resultat === "trop-de-demandes" ? 429 : 503 });
}

export function headers() {
  return { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" };
}

export function meta() {
  return [
    { title: "Se désinscrire de la newsletter — SOS Miam" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ];
}

const LIEN = "underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

function LienContact() {
  return <a href={`mailto:${site.emailContact}?subject=${encodeURIComponent("Désinscription de la newsletter")}`} className={LIEN}>{site.emailContact}</a>;
}

/** La page : le bouton, puis « C'est fait » ; un lien abîmé ou expiré : un message aimable et le contact. */
export default function PageDesinscription({ loaderData, actionData }: Route.ComponentProps) {
  const { lecture, jeton } = loaderData;
  const resultat = actionData?.resultat;
  let contenu;
  if (resultat === "ok") {
    contenu = (
      <>
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation("C'est fait !")}</h1>
        <p className="mt-6 text-lg" role="status">
          {lierPonctuation("C'est fait : tu ne recevras plus la newsletter. Tu peux te réinscrire quand tu veux sur l'accueil.")}
        </p>
        <p className="mt-3 text-gris">{lierPonctuation("Ta boîte mail respire, et le Capitaine Bouiboui garde le cap. Sans rancune, promis.")}</p>
        <div className="mt-8"><Bouton href="/">{lierPonctuation("Retour à l'accueil")}</Bouton></div>
      </>
    );
  } else if (!lecture.ok && lecture.erreur === "jeton-invalide") {
    contenu = (
      <>
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation("Ce lien a perdu le nord")}</h1>
        <p className="mt-6 text-lg">
          {lierPonctuation("On n'arrive pas à le lire : il a peut-être été coupé en route (ça arrive quand un lien passe d'une appli à l'autre).")}
        </p>
        <p className="mt-3 text-lg">
          {lierPonctuation("Pas de panique : écris-nous à")} <LienContact />{lierPonctuation(", même juste « STOP », et on te retire de la liste à la main.")}
        </p>
      </>
    );
  } else {
    // Le bouton, tant que ce n'est pas fait (ou si l'envoi a échoué)
    const souci = resultat ?? (!lecture.ok ? lecture.erreur : null);
    contenu = (
      <>
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation("Se désinscrire de la newsletter")}</h1>
        <p className="mt-6 text-lg">
          {lecture.ok ? (
            <>{lierPonctuation("L'adresse")} <strong>{lecture.email}</strong> {lierPonctuation("ne recevra plus nos nouvelles. Un clic, et c'est réglé.")}</>
          ) : lierPonctuation("Un clic, et tu ne reçois plus nos nouvelles.")}
        </p>
        <p className="mt-3 text-gris">{lierPonctuation("Aucune question, aucun questionnaire de départ : c'est ton droit, et c'est tout.")}</p>
        {souci && (
          <p className="mt-6 rounded-carte border-2 border-encre bg-white p-4" role="alert">
            {souci === "trop-de-demandes"
              ? lierPonctuation("Doucement, moussaillon : beaucoup d'essais d'un coup. Réessaie dans quelques minutes.")
              : souci === "jeton-invalide"
                ? <>{lierPonctuation("Ce lien ne marche pas. Écris-nous à")} <LienContact />{lierPonctuation(" et on s'en occupe.")}</>
                : <>{lierPonctuation("Petit souci de notre côté : réessaie dans un instant, ou écris-nous à")} <LienContact />.</>}
          </p>
        )}
        {jeton && (
          <Form method="post" className="mt-8">
            <input type="hidden" name="jeton" value={jeton} />
            <Bouton type="submit">{lierPonctuation("Me désinscrire")}</Bouton>
          </Form>
        )}
      </>
    );
  }
  return <article className="mx-auto w-[min(760px,100%-32px)] py-12 md:py-16">{contenu}</article>;
}
