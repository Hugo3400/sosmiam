import { useEffect, useRef, useState } from "react";
import { Link, useActionData, useFetcher } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { autresZones, villesLancement } from "~/contenus/villes";

/** Réponse de l'action de la page d'accueil (src/routes/public/accueil.tsx). */
export type ReponseInscription = { ok: boolean; message: string };

const champ = "rounded-full border-2 border-encre bg-white px-5 py-3.5 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre";

/** Dernier bloc de l'accueil : e-mail + ville pour être prévenu du lancement. Marche aussi sans JavaScript. */
export function Inscription() {
  const fetcher = useFetcher<ReponseInscription>();
  // Sans JavaScript (ou envoi avant la fin du chargement), la réponse arrive par l'action de la page.
  // On la garde : le nettoyage du « # » (utiliserAncresSansDiese) est une nouvelle navigation, qui vide useActionData.
  const donneesAction = useActionData<ReponseInscription>();
  const [reponseSansJs] = useState(donneesAction);
  const formulaire = useRef<HTMLFormElement>(null);
  const champEmail = useRef<HTMLInputElement>(null);
  const reponse = fetcher.data ?? reponseSansJs;
  const envoi = fetcher.state !== "idle";

  useEffect(() => {
    if (!reponse) return;
    if (reponse.ok) formulaire.current?.reset();
    else champEmail.current?.focus();
  }, [reponse]);

  return (
    <Section id="inscription" fond="creme">
      <div className="rounded-carte border-2 border-encre bg-jaune px-5 py-12 text-center shadow-brut-grand md:px-12 md:py-16">
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24 md:h-28 md:w-28" />
        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold tracking-tight">Prêt à sauver ta première table ?</h2>
        <p className="mt-3 mb-8 text-lg">Laisse ton e-mail, on te prévient au lancement dans ta ville.</p>

        <fetcher.Form ref={formulaire} method="post" action="/?index#inscription" noValidate className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
          <label htmlFor="inscription-email" className="sr-only">Adresse e-mail</label>
          <input
            ref={champEmail}
            id="inscription-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ton@email.fr"
            required
            aria-invalid={reponse?.ok === false}
            aria-describedby="inscription-message"
            className={`min-w-0 flex-[1_1_240px] ${champ}`}
          />
          <label htmlFor="inscription-ville" className="sr-only">Ta ville</label>
          <select id="inscription-ville" name="ville" className={`flex-[1_1_180px] sm:flex-none ${champ}`}>
            {[...villesLancement, ...autresZones].map((ville) => <option key={ville}>{ville}</option>)}
          </select>
          <Bouton type="submit" variante="encre" className="flex-[1_1_100%] sm:flex-none">
            {envoi ? "Envoi…" : "Préviens-moi"}
          </Bouton>
          <label className="flex w-full cursor-pointer items-center justify-center gap-2.5 pt-1 font-medium">
            <input type="checkbox" name="ambassadeur" value="oui" className="h-5 w-5 shrink-0 accent-encre" />
            <span className="text-left">Je veux devenir ambassadeur fondateur 🎖️</span>
          </label>
        </fetcher.Form>

        <p id="inscription-message" role="status" aria-live="polite" className="mt-5 min-h-7 font-semibold">{reponse?.message}</p>
        <p className="mt-2 text-sm">
          On te prévient du lancement, puis on t'envoie la newsletter (un mail suffit pour te désinscrire). Si tu as coché la case,
          on te parle aussi des ambassadeurs fondateurs. On ne vend jamais tes données
          {" "}(<Link to="/confidentialite" className="font-semibold underline underline-offset-2">confidentialité</Link>).
        </p>
      </div>
    </Section>
  );
}
