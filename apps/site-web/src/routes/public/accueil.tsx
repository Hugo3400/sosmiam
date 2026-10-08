import { data } from "react-router";

import type { Route } from "./+types/accueil";

import { CommentCaMarche } from "~/composants/accueil/CommentCaMarche";
import { DevenirAmbassadeur } from "~/composants/accueil/DevenirAmbassadeur";
import { Hero } from "~/composants/accueil/Hero";
import { IlsOntBesoinDeToi } from "~/composants/accueil/IlsOntBesoinDeToi";
import { Inscription, type ReponseInscription } from "~/composants/accueil/Inscription";
import { PourLesPros } from "~/composants/accueil/PourLesPros";
import { BigSosEnBref } from "~/composants/big-sos/BigSosEnBref";
import { villesLancement } from "~/contenus/villes";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { verifierEmail } from "~/fonctions/texte/verifier-email";

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

  if (!verifierEmail(email)) {
    return { ok: false, message: "Oups, cette adresse e-mail ne semble pas valide." };
  }

  // À FAIRE avec l'API : enregistrer l'inscription (services/inscriptions.ts). Pour l'instant, rien n'est gardé.
  const ou = villesLancement.includes(ville) ? `à ${ville}` : "près de chez toi";
  const suite = ambassadeur ? " Et on revient vers toi pour les ambassadeurs fondateurs. 🎖️" : "";
  return { ok: true, message: `C'est noté ! On te prévient dès que SOS Miam arrive ${ou}. 🛟${suite}` };
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
