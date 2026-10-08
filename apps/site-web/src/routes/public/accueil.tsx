import { data } from "react-router";

import type { Route } from "./+types/accueil";

import { CommentCaMarche } from "~/composants/accueil/CommentCaMarche";
import { DevenirAmbassadeur } from "~/composants/accueil/DevenirAmbassadeur";
import { Hero } from "~/composants/accueil/Hero";
import { IlsOntBesoinDeToi } from "~/composants/accueil/IlsOntBesoinDeToi";
import { Inscription, type ReponseInscription } from "~/composants/accueil/Inscription";
import { PourLesPros } from "~/composants/accueil/PourLesPros";
import { BigSosEnBref } from "~/composants/big-sos/BigSosEnBref";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { trouverLieuPropose } from "~/fonctions/texte/trouver-lieu-propose";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { inscrireNewsletter, type ResultatInscription } from "~/services/inscriptions.server";

const messagesErreur: Record<Exclude<ResultatInscription, "ok">, string> = {
  "email-invalide": "Oups, cette adresse e-mail ne semble pas valide.",
  "trop-de-demandes": "Doucement ! Trop d'essais d'affilée : réessaie dans quelques minutes.",
  erreur: "Oups, ton inscription n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
};

export function meta(_: Route.MetaArgs) {
  return creerMeta({
    titre: "SOS Miam",
    description:
      "Découvre les restos, pâtisseries, bars et sorties indépendants de Montpellier et de l'Hérault qui ont besoin de monde, et viens à leur rescousse.",
  });
}

/** Reçoit le formulaire « Préviens-moi » (avec ou sans JavaScript dans le navigateur). */
export async function action({ request }: Route.ActionArgs): Promise<ReponseInscription> {
  let formulaire: FormData;
  try {
    formulaire = await request.formData();
  } catch {
    // Corps vide ou qui n'est pas un formulaire (robot…) : erreur du visiteur, pas du serveur
    throw data("Formulaire illisible", { status: 400 });
  }
  const email = String(formulaire.get("email") ?? "");
  const ville = String(formulaire.get("ville") ?? "");
  const ambassadeur = formulaire.get("ambassadeur") === "oui";
  const beta = formulaire.get("beta") === "oui";
  const telephoneSaisi = formulaire.get("telephone");
  const telephone = telephoneSaisi === "iphone" || telephoneSaisi === "android" ? telephoneSaisi : null;
  const piege = String(formulaire.get("piege") ?? "");
  // Renvoyées avec un refus : sans JavaScript, le formulaire se remplit de nouveau avec ce qui avait été tapé
  const valeurs = { email, ville, telephone: telephone ?? "", beta, ambassadeur };

  if (!verifierEmail(email)) {
    return { ok: false, message: "Oups, cette adresse e-mail ne semble pas valide.", champ: "email", valeurs };
  }
  // Pour inviter quelqu'un à la bêta, il faut savoir sur quel store : App Store (iPhone) ou Play Store (Android)
  if (beta && !telephone) {
    return { ok: false, message: "Pour la bêta, dis-nous si tu as un iPhone ou un Android.", champ: "telephone", valeurs };
  }

  // Un lieu proposé reconnu (« sete ») est enregistré sous son vrai nom (« Sète »), le reste tel que tapé
  const lieu = trouverLieuPropose(ville);
  // nginx transmet l'adresse IP du visiteur : l'API s'en sert pour limiter les essais, sans la garder
  const resultat = await inscrireNewsletter(
    { email, ville: lieu?.valeur ?? ville, ambassadeur, telephone, beta, piege },
    request.headers.get("x-real-ip"),
  );
  if (resultat !== "ok") {
    return { ok: false, message: lierPonctuation(messagesErreur[resultat]), champ: resultat === "email-invalide" ? "email" : undefined, valeurs };
  }

  // Espace insécable avant chaque émoji : il ne part jamais seul à la ligne
  const ou = lieu?.ou ?? "près de chez toi";
  const suites = [
    beta ? "On t'invite à tester la bêta dès qu'elle est prête.\u00a0🧪" : "",
    ambassadeur ? "On revient aussi vers toi pour les ambassadeurs fondateurs.\u00a0🎖️" : "",
  ].filter(Boolean);
  return { ok: true, message: lierPonctuation([`C'est noté ! On te prévient dès que SOS Miam arrive ${ou}.\u00a0🛟`, ...suites].join(" ")) };
}

/** Page d'accueil : la promesse, le principe, les lieux, le BIG SOS, les pros, les ambassadeurs et l'inscription. */
export default function Accueil() {
  return (
    <>
      <Hero />
      <CommentCaMarche />
      <IlsOntBesoinDeToi />
      <BigSosEnBref />
      <PourLesPros />
      <DevenirAmbassadeur />
      <Inscription />
    </>
  );
}
