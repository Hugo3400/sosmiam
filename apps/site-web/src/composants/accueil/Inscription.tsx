import { useEffect, useRef, useState } from "react";
import { Link, useActionData, useFetcher } from "react-router";

import { ChampVilleOuRegion } from "~/composants/accueil/ChampVilleOuRegion";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Ce qui avait été envoyé, renvoyé en cas de refus pour remplir de nouveau le formulaire (utile sans JavaScript). */
export type ValeursInscription = { email: string; ville: string; telephone: string; beta: boolean; ambassadeur: boolean };

/** Réponse de l'action de la page d'accueil (src/routes/public/accueil.tsx). « champ » : le champ en faute, s'il y en a un. */
export type ReponseInscription = { ok: boolean; message: string; champ?: "email" | "telephone"; valeurs?: ValeursInscription };

const champ = "rounded-full border-2 border-encre bg-white px-5 py-3.5 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte";
const libelle = "mb-1.5 block px-2 text-left text-sm font-semibold";
const erreur = "mt-1.5 px-2 text-left text-sm font-semibold text-rouge-texte";

// Pour savoir sur quel store publier l'app en premier, et sur lequel inviter les bêta-testeurs
const telephones = [
  { valeur: "iphone", emoji: "🍏", texte: "iPhone (Apple)" },
  { valeur: "android", emoji: "🤖", texte: "Android (Samsung, Google Pixel ou autre)" },
];

/** Dernier bloc de l'accueil : être prévenu du lancement, dire son téléphone, tester la bêta. Marche aussi sans JavaScript. */
export function Inscription() {
  const fetcher = useFetcher<ReponseInscription>();
  // Sans JavaScript (ou envoi avant la fin du chargement), la réponse arrive par l'action de la page.
  // On la garde : le nettoyage du « # » (utiliserAncresSansDiese) est une nouvelle navigation, qui vide useActionData.
  const donneesAction = useActionData<ReponseInscription>();
  const [reponseSansJs] = useState(donneesAction);
  // Valeurs remises après un refus sans JavaScript : figées au premier affichage, oubliées après une réussite
  const [valeurs, setValeurs] = useState(() => (donneesAction && !donneesAction.ok ? donneesAction.valeurs : undefined));
  // Changer la clé du formulaire le recrée vide (champ ville compris) après une inscription réussie
  const [cleFormulaire, setCleFormulaire] = useState(0);
  // Numéro de réponse : le message est recréé à chaque réponse, donc relu même s'il est identique au précédent
  const [numeroReponse, setNumeroReponse] = useState(0);
  // Vrai de l'envoi jusqu'à la réponse : messages et erreurs sont retirés puis remis, donc relus. Posé dans onSubmit, dont le
  // rendu s'affiche tout de suite : fetcher.state passe par une transition, que React saute si la réponse arrive très vite.
  const [enAttente, setEnAttente] = useState(false);
  const formulaire = useRef<HTMLFormElement>(null);
  const champEmail = useRef<HTMLInputElement>(null);
  const premierTelephone = useRef<HTMLInputElement>(null);
  const reponse = fetcher.data ?? reponseSansJs;
  const envoi = fetcher.state !== "idle";
  // Après un refus sans JavaScript, on remet ce qui avait été tapé
  const erreurSur = reponse && !reponse.ok ? reponse.champ : undefined;

  useEffect(() => {
    if (!reponse) return;
    setEnAttente(false);
    setNumeroReponse((numero) => numero + 1);
    if (reponse.ok) {
      setValeurs(undefined);
      setCleFormulaire((cle) => cle + 1);
    }
    else if (reponse.champ === "telephone") premierTelephone.current?.focus();
    else if (reponse.champ === "email") champEmail.current?.focus();
  }, [reponse]);

  // Sans JavaScript, la page se recharge en haut du bloc : le message y est affiché, au-dessus du formulaire
  const messageEnHaut = !fetcher.data && Boolean(reponseSansJs);
  // Message général (réussite, trop d'essais, panne) ; les erreurs d'un champ s'affichent sous ce champ,
  // et aussi en haut sans JavaScript (sur téléphone, le champ peut être hors de l'écran). Vidé pendant l'envoi.
  const messageGeneral = !enAttente && reponse && (!erreurSur || messageEnHaut) ? reponse.message : "";

  // Sur téléphone, la confirmation est sous le bouton : on la fait venir dans l'écran une fois affichée
  // (pas dans l'effet [reponse] : l'envoi n'y est pas encore fini, la zone est encore vide)
  useEffect(() => {
    if (messageGeneral && reponse?.ok && !messageEnHaut) {
      document.getElementById("inscription-message")?.scrollIntoView({ block: "nearest" });
    }
  }, [messageGeneral, messageEnHaut, reponse]);

  const zoneMessage = (
    <p id="inscription-message" role="status" aria-live="polite" className={`font-semibold ${messageEnHaut ? "mb-6" : "mt-5 min-h-7"}`}>
      <span key={numeroReponse}>{messageGeneral}</span>
    </p>
  );

  return (
    <Section id="inscription" fond="creme">
      <div className="rounded-carte border-2 border-encre bg-jaune px-5 py-12 text-center shadow-brut-grand md:px-12 md:py-16">
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24 md:h-28 md:w-28" />
        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold tracking-tight">{lierPonctuation("Prêt à sauver ta première table ?")}</h2>
        <p className="mt-3 mb-8 text-lg">{lierPonctuation("L'app est encore en cuisine : laisse ton e-mail, on te prévient dès qu'elle arrive près de chez toi.")}</p>
        {messageEnHaut && zoneMessage}

        <fetcher.Form key={cleFormulaire} ref={formulaire} method="post" action="/?index#inscription" noValidate onSubmit={() => setEnAttente(true)} className="mx-auto flex max-w-2xl flex-wrap items-start justify-center gap-3">
          <div className="min-w-0 flex-[1_1_240px]">
            <label htmlFor="inscription-email" className={libelle}>Ton e-mail</label>
            <input
              ref={champEmail}
              id="inscription-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ton@email.fr"
              required
              defaultValue={valeurs?.email}
              aria-invalid={erreurSur === "email"}
              aria-describedby={erreurSur === "email" ? "inscription-email-erreur" : undefined}
              className={`w-full ${champ}`}
            />
            {/* role="alert" et absent pendant l'envoi : l'erreur est lue à chaque réponse, même quand le focus ne bouge pas */}
            {erreurSur === "email" && !enAttente && <p id="inscription-email-erreur" role="alert" className={erreur}>{reponse?.message}</p>}
          </div>
          <div className="min-w-0 flex-[1_1_220px]">
            <label htmlFor="inscription-ville" className={libelle}>Ta ville ou ta région <span className="font-normal">(facultatif)</span></label>
            <ChampVilleOuRegion id="inscription-ville" name="ville" classeChamp={champ} valeurInitiale={valeurs?.ville} />
          </div>

          <div
            role="radiogroup"
            aria-labelledby="inscription-telephone-titre"
            aria-invalid={erreurSur === "telephone"}
            aria-describedby={erreurSur === "telephone" ? "inscription-telephone-erreur" : undefined}
            className="w-full pt-2"
          >
            <p id="inscription-telephone-titre" className="mb-2.5 font-medium">{lierPonctuation("Ton téléphone (pour savoir sur quel store sortir l'app) :")}</p>
            <div className={`flex flex-col gap-2.5 rounded-3xl sm:flex-row sm:flex-wrap sm:justify-center ${erreurSur === "telephone" ? "outline-3 outline-offset-4 outline-rouge-texte" : ""}`}>
              {telephones.map((telephone, position) => (
                <label key={telephone.valeur} className="group block cursor-pointer">
                  <input
                    ref={position === 0 ? premierTelephone : undefined}
                    type="radio"
                    name="telephone"
                    value={telephone.valeur}
                    defaultChecked={valeurs?.telephone === telephone.valeur}
                    className="peer sr-only"
                  />
                  {/* Coché : fond encre ET coche ✓, cachée aux lecteurs d'écran (la radio dit déjà « cochée »), qui reste visible
                      en mode de contraste élevé, où les couleurs disparaissent */}
                  <span className="block rounded-full border-2 border-encre bg-white px-4 py-2.5 font-semibold transition-colors hover:bg-jaune-clair sm:py-2
                    peer-checked:bg-encre peer-checked:text-jaune peer-checked:hover:bg-encre
                    peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-encre">
                    <span aria-hidden="true" className="hidden group-has-checked:inline">✓ </span>
                    <span aria-hidden="true">{telephone.emoji}</span> {telephone.texte}
                  </span>
                </label>
              ))}
            </div>
            {erreurSur === "telephone" && !enAttente && (
              <p id="inscription-telephone-erreur" role="alert" className="mt-2 px-2 text-sm font-semibold text-rouge-texte">{reponse?.message}</p>
            )}
          </div>

          <div className="mx-auto flex w-fit max-w-full flex-col items-start gap-3 pt-2 text-left">
            <div>
              <label className="flex cursor-pointer items-center gap-2.5 font-medium">
                <input type="checkbox" name="beta" value="oui" defaultChecked={valeurs?.beta ?? false} aria-describedby="inscription-beta-aide" className="h-5 w-5 shrink-0 accent-encre" />
                <span>Je veux tester l'app avant sa sortie (bêta) <span aria-hidden="true">🧪</span></span>
              </label>
              <p id="inscription-beta-aide" className="mt-1 max-w-md pl-7.5 text-sm">
                {lierPonctuation("Choisis aussi ton téléphone juste au-dessus. Sur Android, ton e-mail doit être celui de ton compte Google (souvent ton Gmail) ; sur iPhone, de préférence celui de ton compte Apple.")}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 font-medium">
              <input type="checkbox" name="ambassadeur" value="oui" defaultChecked={valeurs?.ambassadeur ?? false} className="h-5 w-5 shrink-0 accent-encre" />
              <span>Je veux devenir ambassadeur fondateur <span aria-hidden="true">🎖️</span></span>
            </label>
          </div>

          <div className="flex w-full justify-center pt-2">
            <Bouton type="submit" variante="encre" className="w-full sm:w-auto sm:min-w-44">
              {envoi ? "Envoi…" : "Préviens-moi"}
            </Bouton>
          </div>
          {/* Champ piège : invisible pour les humains et les lecteurs d'écran, les robots le remplissent */}
          <input type="text" name="piege" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
        </fetcher.Form>

        {!messageEnHaut && zoneMessage}
        <p className="mt-2 text-sm">
          On te prévient du lancement, puis on t'envoie la newsletter (un mail suffit pour te désinscrire). Si tu coches la bêta,
          on transmet ton adresse à Google ou à Apple pour t'inviter à tester l'app{" "}; si tu coches ambassadeur, on te parle aussi
          des ambassadeurs fondateurs. On ne vend jamais tes données
          {" "}(<Link to="/confidentialite" target="_blank" rel="noopener" className="font-semibold underline underline-offset-2">confidentialité<span className="sr-only">, s'ouvre dans un nouvel onglet</span></Link>).
        </p>
      </div>
    </Section>
  );
}
