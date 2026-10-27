import { useActionData } from "react-router";

import { remplirModele } from "../../../../../packages/commun/src/fonctions/texte/remplir-modele.ts";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TEXTES_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { decrireFinLimitation } from "~/fonctions/compte/decrire-fin-limitation";
import { ecrireMomentAParisLangue } from "~/fonctions/dates/ecrire-moment-a-paris-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { LimitationCompte } from "~/types/compte";

/** Le nom du formulaire de contestation (champ caché « formulaire »), lu par l'action de « Mon compte » */
export const FORMULAIRE_CONTESTATION = "contestation";

type Props = {
  limitation: LimitationCompte;
  /** Le motif en clair (lireMotifLimitation) : son nom et la règle des CGU (null : code inconnu du site) */
  motif: { libelle: string; regle: string | null };
};

const classeTitreBloc = "mb-1 font-extrabold";

/**
 * « Ton compte est limité », en haut de « Mon compte » : le motif en clair, le pourquoi écrit par l'équipe, la fin (ou
 * « jusqu'à nouvel ordre »), ce qui change et ce qui reste, puis « Contester » (formulaire POST, marche sans JavaScript),
 * ou la contestation envoyée et son état. Avec dignité : on explique, on ne fait pas la morale.
 */
export function EncadreCompteLimite({ limitation, motif }: Props) {
  const t = utiliserTextes(TEXTES_LIMITATION_PAR_LANGUE);
  const langue = utiliserLangue();
  const fin = decrireFinLimitation(limitation.fin, langue);
  const debut = ecrireMomentAParisLangue(limitation.debut, langue) ?? "";
  const intro = limitation.active ? remplirModele(t.intro, { fin }) : remplirModele(t.introAVenir, { debut, fin });
  const contesteLe = limitation.contesteLe ? ecrireMomentAParisLangue(limitation.contesteLe, langue) : null;
  const reexamineLe = limitation.reexamineLe ? ecrireMomentAParisLangue(limitation.reexamineLe, langue) : null;
  const motifFrancais = langue === "fr" ? undefined : "fr";
  // Contestation envoyée : le formulaire laisse la place à la contestation ; ce message-ci est lu par les lecteurs d'écran
  const reponse = useActionData<ReponseFormulaire>();
  const envoyee = reponse?.formulaire === FORMULAIRE_CONTESTATION && reponse.ok && limitation.contestation !== null;
  return (
    <section aria-labelledby="compte-limite" className="rounded-carte border-2 border-encre bg-jaune-clair p-6 shadow-brut md:p-10">
      <h2 id="compte-limite" className="mb-3 text-2xl font-extrabold">
        <span aria-hidden="true">⏸️ </span>{limitation.active ? t.titre : t.titreAVenir}
      </h2>
      <p className="mb-6">{lierPonctuation(intro)}</p>
      <dl className="grid gap-4">
        <div>
          <dt className={classeTitreBloc}>{t.motif}</dt>
          <dd>
            <strong lang={motifFrancais}>{motif.libelle}</strong>
            {motif.regle && <span lang={motifFrancais} className="text-gris">{lierPonctuation(t.regle(motif.regle))}</span>}
          </dd>
        </div>
        <div>
          <dt className={classeTitreBloc}>{t.pourquoi}</dt>
          <dd lang={motifFrancais} className="whitespace-pre-line rounded-2xl border-2 border-encre bg-white px-4 py-3">{limitation.motivation}</dd>
        </div>
        <div>
          <dt className={classeTitreBloc}>{t.coupeTitre}</dt>
          <dd>{lierPonctuation(t.coupe)}</dd>
        </div>
        <div>
          <dt className={classeTitreBloc}>{t.resteTitre}</dt>
          <dd>{lierPonctuation(t.reste)}</dd>
        </div>
      </dl>
      <div className="mt-8 border-t-2 border-dashed border-encre pt-6">
        <h3 className="mb-2 text-xl font-extrabold">{lierPonctuation(t.contesterTitre)}</h3>
        {limitation.contestation !== null ? (
          <>
            {envoyee && <p role="status" className="mb-3 font-semibold"><span aria-hidden="true">✓ </span>{lierPonctuation(t.envoiReussi)}</p>}
            <p className="mb-2">{lierPonctuation(remplirModele(t.contestationEnvoyee, { date: contesteLe ?? "" }))}</p>
            <blockquote className="mb-3 whitespace-pre-line rounded-2xl border-2 border-encre bg-white px-4 py-3">{limitation.contestation}</blockquote>
            <p className="font-semibold">
              {lierPonctuation(reexamineLe ? remplirModele(t.contestationMaintenue, { date: reexamineLe }) : t.contestationEnAttente)}
            </p>
          </>
        ) : limitation.peutContester ? (
          <>
            <p className="mb-5">{lierPonctuation(t.contester)}</p>
            <FormulaireCompte nom={FORMULAIRE_CONTESTATION} bouton={t.boutonContester}>
              <ChampTexte nom="texte" libelle={t.libelleContestation} aide={lierPonctuation(t.aideContestation)} lignes={6} maximum={1000} />
            </FormulaireCompte>
          </>
        ) : (
          <p>{lierPonctuation(t.contestationAVenir)}</p>
        )}
      </div>
    </section>
  );
}
