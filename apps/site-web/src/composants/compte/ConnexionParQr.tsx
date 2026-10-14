import { Bouton } from "~/composants/interface/Bouton";
import { BOUTON_QR, BOUTON_REFAIRE_QR, INTRO_QR, LIEN_SANS_JS_QR, MESSAGES_QR, PRUDENCE_QR, TITRE_QR } from "~/contenus/connexion-qr";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConnexionQr } from "~/hooks/utiliser-connexion-qr";
import type { PageDepart } from "~/types/connexion-externe";
import type { QrAffiche } from "~/types/connexion-qr";

type Props = {
  /** La page qui montre le bloc : on y revient sans JavaScript, et elle choisit la page ouverte ensuite */
  depart: Extract<PageDepart, "/connexion" | "/mon-compte">;
  /** Chemin à rouvrir après la connexion */
  retour?: string | null;
  /** Le QR redessiné par la page (retour sans JavaScript, « ?qr=… »), sinon null : le bloc reste fermé */
  initial: QrAffiche | null;
};

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * « Me connecter avec l'app » (connexion par QR code, comme Discord), sous le formulaire de connexion : pas de QR tant
 * qu'on n'a pas cliqué (aucune demande inutile). Le QR vit 2 minutes ; le texte suit où il en est (annoncé aux lecteurs
 * d'écran). Sans JavaScript : le bouton recharge la page avec le QR, et « J'ai validé sur mon téléphone » fait la suite.
 */
export function ConnexionParQr({ depart, retour = null, initial }: Props) {
  const { bloc, demander } = utiliserConnexionQr(initial);
  const avecQr = bloc.svg !== null && (bloc.etat === "attente" || bloc.etat === "scanne" || bloc.etat === "accepte");
  const message = bloc.etat === "ferme" || bloc.etat === "chargement" ? null : MESSAGES_QR[bloc.etat];
  return (
    <section id="connexion-qr" aria-labelledby="titre-connexion-qr" className="mt-8 rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <h2 id="titre-connexion-qr" className="text-xl font-extrabold"><span aria-hidden="true">📱 </span>{TITRE_QR}</h2>
      <p className="mt-2 text-gris">{lierPonctuation(INTRO_QR)}</p>
      {avecQr && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="w-56 max-w-full rounded-2xl border-2 border-encre bg-white p-2" dangerouslySetInnerHTML={{ __html: bloc.svg ?? "" }} />
          <a href="/connexion/qr/attente" className={`text-sm ${classeLien}`}>{lierPonctuation(LIEN_SANS_JS_QR)}</a>
        </div>
      )}
      <p role="status" aria-live="polite" className={message ? "mt-4 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-3 text-center font-semibold" : "sr-only"}>
        {message && lierPonctuation(message)}
      </p>
      {!avecQr && (
        <form
          method="post" action="/connexion/qr" className="mt-5"
          onSubmit={(evenement) => {
            evenement.preventDefault();
            void demander(evenement.currentTarget);
          }}
        >
          <input type="hidden" name="depart" value={depart} />
          {retour && <input type="hidden" name="retour" value={retour} />}
          <Bouton type="submit" variante="blanc" className="w-full">
            {bloc.etat === "chargement" ? "Un instant…" : bloc.etat === "ferme" ? BOUTON_QR : BOUTON_REFAIRE_QR}
          </Bouton>
        </form>
      )}
      <p className="mt-4 text-sm text-gris">{lierPonctuation(PRUDENCE_QR)}</p>
    </section>
  );
}
