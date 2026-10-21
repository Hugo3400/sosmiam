import { data, Form } from "react-router";

import type { Route } from "./+types/confirmer-newsletter";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { aFormeDeJetonConfirmation, confirmerNewsletter } from "~/services/confirmation-newsletter.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

const STATUTS = { ok: 200, "jeton-invalide": 400, "trop-de-demandes": 429, indisponible: 503 } as const;
const TITRE = "text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight";
const LIEN = "underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

export async function loader({ request }: Route.LoaderArgs) {
  const jeton = new URL(request.url).searchParams.get("jeton");
  return data({ jeton: aFormeDeJetonConfirmation(jeton) ? jeton : null }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function action({ request }: Route.ActionArgs) {
  const champ = (await request.formData().catch(() => null))?.get("jeton");
  const resultat = await confirmerNewsletter(typeof champ === "string" ? champ : null, lireIpVisiteur(request));
  return data({ resultat }, { status: STATUTS[resultat] });
}

export function headers() {
  return { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" };
}

export function meta() {
  return [
    { title: "Confirmer ma newsletter — SOS Miam" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ];
}

export default function PageConfirmerNewsletter({ loaderData, actionData }: Route.ComponentProps) {
  const resultat = actionData?.resultat;
  const contact = (
    <a href={`mailto:${site.emailContact}?subject=${encodeURIComponent("Inscription à la newsletter")}`} className={LIEN}>{site.emailContact}</a>
  );
  let contenu;
  if (resultat === "ok") {
    contenu = (
      <>
        <Mascotte expression="clin" className="mb-6 h-24 w-24" />
        <h1 className={TITRE}>{lierPonctuation("Bienvenue chez les Miamis !")}</h1>
        <p className="mt-6 text-lg" role="status">
          {lierPonctuation("C'est confirmé : tu recevras nos nouvelles, à commencer par l'arrivée de SOS Miam près de chez toi.")}
        </p>
        <p className="mt-3 text-gris">
          {lierPonctuation("Le Capitaine Bouiboui a sorti les cotillons. Et si un jour tu veux souffler, le lien « Me désinscrire » t'attend en bas de chaque newsletter, sans rancune.")}
        </p>
        <div className="mt-8"><Bouton href="/">{lierPonctuation("Retour à l'accueil")}</Bouton></div>
      </>
    );
  } else if (resultat === "jeton-invalide" || !loaderData.jeton) {
    contenu = (
      <>
        <Mascotte expression="surprise" className="mb-6 h-24 w-24" />
        <h1 className={TITRE}>{lierPonctuation("Ce lien a pris le large")}</h1>
        <p className="mt-6 text-lg">
          {lierPonctuation("Il a déjà servi, il a plus de 7 jours, un lien plus récent l'a remplacé, ou il s'est abîmé en route (ça arrive quand un lien passe d'une appli à l'autre).")}
        </p>
        <p className="mt-3 text-lg">
          {lierPonctuation("Tu as déjà cliqué ? Alors tout est bon, tu fais partie des Miamis. Sinon, réinscris-toi en bas de l'accueil : un lien tout neuf t'attendra dans ta boîte mail.")}
        </p>
        <div className="mt-8"><Bouton href="/#inscription">{lierPonctuation("Me réinscrire")}</Bouton></div>
      </>
    );
  } else {
    contenu = (
      <>
        <Mascotte expression="miam" className="mb-6 h-24 w-24" />
        <h1 className={TITRE}>{lierPonctuation("Dernier petit clic !")}</h1>
        <p className="mt-6 text-lg">
          {lierPonctuation("Confirme, et tu rejoins les Miamis : nouveaux lieux, nouvelles villes et BIG SOS près de chez toi, directement dans ta boîte.")}
        </p>
        <p className="mt-3 text-gris">
          {lierPonctuation("Pas de spam, promis : le Capitaine Bouiboui déteste ça autant que les frites froides. Tu te désinscris en un clic quand tu veux.")}
        </p>
        {resultat && (
          <p className="mt-6 rounded-carte border-2 border-encre bg-white p-4" role="alert">
            {resultat === "trop-de-demandes"
              ? lierPonctuation("Doucement, moussaillon : beaucoup d'essais d'un coup. Réessaie dans quelques minutes.")
              : <>{lierPonctuation("Petit souci de notre côté : réessaie dans un instant, ou écris-nous à")} {contact}.</>}
          </p>
        )}
        <Form method="post" className="mt-8">
          <input type="hidden" name="jeton" value={loaderData.jeton} />
          <Bouton type="submit">{lierPonctuation("Je confirme mon inscription")}</Bouton>
        </Form>
      </>
    );
  }
  return <article className="mx-auto w-[min(760px,100%-32px)] py-12 md:py-16">{contenu}</article>;
}
