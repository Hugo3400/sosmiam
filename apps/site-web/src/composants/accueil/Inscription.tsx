import { useEffect, useRef, useState } from "react";
import { Link, useActionData, useFetcher } from "react-router";

import { ChampVilleOuRegion } from "~/composants/accueil/ChampVilleOuRegion";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";

/** Réponse de l'action de la page d'accueil (src/routes/public/accueil.tsx). « champ » : où remettre le focus en cas d'erreur. */
export type ReponseInscription = { ok: boolean; message: string; champ?: "email" | "telephone" };

const champ = "rounded-full border-2 border-encre bg-white px-5 py-3.5 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre";

// Pour savoir sur quel store publier l'app en premier, et sur lequel inviter les bêta-testeurs
const telephones = [
  { valeur: "iphone", libelle: "🍏 iPhone (Apple)" },
  { valeur: "android", libelle: "🤖 Android (Samsung, Google Pixel ou autre)" },
];

/** Dernier bloc de l'accueil : être prévenu du lancement, dire son téléphone, tester la bêta. Marche aussi sans JavaScript. */
export function Inscription() {
  const fetcher = useFetcher<ReponseInscription>();
  // Sans JavaScript (ou envoi avant la fin du chargement), la réponse arrive par l'action de la page.
  // On la garde : le nettoyage du « # » (utiliserAncresSansDiese) est une nouvelle navigation, qui vide useActionData.
  const donneesAction = useActionData<ReponseInscription>();
  const [reponseSansJs] = useState(donneesAction);
  const formulaire = useRef<HTMLFormElement>(null);
  const champEmail = useRef<HTMLInputElement>(null);
  const premierTelephone = useRef<HTMLInputElement>(null);
  const reponse = fetcher.data ?? reponseSansJs;
  const envoi = fetcher.state !== "idle";

  useEffect(() => {
    if (!reponse) return;
    if (reponse.ok) formulaire.current?.reset();
    else if (reponse.champ === "telephone") premierTelephone.current?.focus();
    else champEmail.current?.focus();
  }, [reponse]);

  return (
    <Section id="inscription" fond="creme">
      <div className="rounded-carte border-2 border-encre bg-jaune px-5 py-12 text-center shadow-brut-grand md:px-12 md:py-16">
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24 md:h-28 md:w-28" />
        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold tracking-tight">Prêt à sauver ta première table ?</h2>
        <p className="mt-3 mb-8 text-lg">L'app est encore en cuisine : laisse ton e-mail, on te prévient dès qu'elle arrive près de chez toi.</p>

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
            aria-invalid={reponse?.ok === false && reponse.champ !== "telephone"}
            aria-describedby="inscription-message"
            className={`min-w-0 flex-[1_1_240px] ${champ}`}
          />
          <label htmlFor="inscription-ville" className="sr-only">Ta ville ou ta région</label>
          <ChampVilleOuRegion id="inscription-ville" name="ville" className="min-w-0 flex-[1_1_220px]" classeChamp={champ} />

          <div role="radiogroup" aria-labelledby="inscription-telephone-titre" className="w-full pt-3">
            <p id="inscription-telephone-titre" className="mb-2.5 font-medium">Ton téléphone (pour savoir sur quel store sortir l'app) :</p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
              {telephones.map((telephone, position) => (
                <label key={telephone.valeur} className="block cursor-pointer">
                  <input
                    ref={position === 0 ? premierTelephone : undefined}
                    type="radio"
                    name="telephone"
                    value={telephone.valeur}
                    aria-describedby="inscription-message"
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border-2 border-encre bg-white px-4 py-2.5 font-semibold transition-colors hover:bg-jaune-clair sm:py-2
                    peer-checked:bg-encre peer-checked:text-jaune peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-encre">
                    {telephone.libelle}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-2.5 pt-2">
            <label className="flex cursor-pointer items-center gap-2.5 font-medium">
              <input type="checkbox" name="beta" value="oui" aria-describedby="inscription-beta-aide" className="h-5 w-5 shrink-0 accent-encre" />
              <span className="text-left">Je veux tester l'app avant sa sortie (bêta) 🧪</span>
            </label>
            <p id="inscription-beta-aide" className="max-w-md text-sm">
              Sur Android, la bêta passe par le Play Store : mets l'adresse de ton compte Google (souvent ton Gmail). Sur iPhone, celle de ton compte Apple, c'est plus simple.
            </p>
            <label className="flex cursor-pointer items-center gap-2.5 font-medium">
              <input type="checkbox" name="ambassadeur" value="oui" className="h-5 w-5 shrink-0 accent-encre" />
              <span className="text-left">Je veux devenir ambassadeur fondateur 🎖️</span>
            </label>
          </div>

          <div className="flex w-full justify-center pt-2">
            <Bouton type="submit" variante="encre" className="w-full sm:w-auto">
              {envoi ? "Envoi…" : "Préviens-moi"}
            </Bouton>
          </div>
          {/* Champ piège : invisible pour les humains et les lecteurs d'écran, les robots le remplissent */}
          <input type="text" name="piege" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
        </fetcher.Form>

        <p id="inscription-message" role="status" aria-live="polite" className="mt-5 min-h-7 font-semibold">{reponse?.message}</p>
        <p className="mt-2 text-sm">
          On te prévient du lancement, puis on t'envoie la newsletter (un mail suffit pour te désinscrire). Si tu coches la bêta,
          on transmet ton adresse à Google ou à Apple pour t'inviter à tester l'app ; si tu coches ambassadeur, on te parle aussi
          des ambassadeurs fondateurs. On ne vend jamais tes données
          {" "}(<Link to="/confidentialite" className="font-semibold underline underline-offset-2">confidentialité</Link>).
        </p>
      </div>
    </Section>
  );
}
