import { Link } from "react-router";

import type { Route } from "./+types/mot-de-passe-oublie";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { site } from "~/contenus/legal/informations-legales";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Le site n'envoie pas encore de mails : l'équipe prépare le lien depuis le logiciel de gestion et l'envoie à la main
const etapes = [
  `Écris-nous à ${site.emailContact} depuis l'adresse e-mail de ton compte : c'est comme ça qu'on sait que c'est bien toi.`,
  "On te répond avec un lien pour choisir un nouveau mot de passe. Il marche pendant 24 heures, et une seule fois.",
  "Tu ouvres le lien, tu choisis ton nouveau mot de passe, et c'est reparti !",
];

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Mot de passe oublié", description: "Mot de passe oublié dans l'espace ambassadeur SOS Miam : la marche à suivre." }),
    { name: "robots", content: "noindex" },
  ];
}

/** Page /mot-de-passe-oublie : la marche à suivre, par mail (pas de formulaire tant que le site n'envoie pas de mails). */
export default function PageMotDePasseOublie() {
  const sujet = encodeURIComponent("Mot de passe oublié (espace ambassadeur)");
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Pas de panique, ça arrive à tout le monde. Voici comment en choisir un nouveau.")}>
        {lierPonctuation("Mot de passe oublié ?")}
      </TitreSection>
      <div className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <Mascotte expression="surprise" className="mb-5 h-20 w-20" />
        <ol className="grid gap-4 text-lg">
          {etapes.map((etape, i) => (
            <li key={etape} className="flex gap-4">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune font-titre font-extrabold">
                {i + 1}
              </span>
              <span className="pt-0.5">{lierPonctuation(etape)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Bouton href={`mailto:${site.emailContact}?subject=${sujet}`}>{`Écrire à ${site.emailContact}`}</Bouton>
          <Link to="/connexion" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </Section>
  );
}
