import { useEffect, useId, useRef, useState } from "react";

import { ChoixFichierImage } from "~/composants/pro/ChoixFichierImage";
import { MessageImageLieu, type EtatMessageImageLieu } from "~/composants/pro/MessageImageLieu";
import { RecadrageImage } from "~/composants/pro/RecadrageImage";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/pro-images-lieu";
import { appelerRouteImageLieu } from "~/fonctions/pro/appeler-route-image-lieu";
import { calculerCadreRecadrage } from "~/fonctions/pro/calculer-cadre-recadrage";
import { choisirMessageImageLieu } from "~/fonctions/pro/choisir-message-image-lieu";
import { exporterImageLieu } from "~/fonctions/pro/exporter-image-lieu";
import { ouvrirImageLocale, POIDS_MAX_IMAGE_SOURCE } from "~/fonctions/pro/ouvrir-image-locale";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { BrouillonImageLieu, ReponseImageLieu } from "~/types/images-lieu";
import { REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../../packages/commun/src/regles/images-lieu.ts";

type Props = {
  lieuId: number;
  quelle: ImageLieu;
  actuelle: string | null;
  connue: boolean;
  brouillon: BrouillonImageLieu | null;
  onBrouillon: (brouillon: BrouillonImageLieu | null) => void;
  onEnregistree: (adresse: string | null, connue: boolean) => void;
};

type Occupation = "ouverture" | "envoi" | "retrait";

const REGLAGE_DEPART = { zoom: 1, x: 0.5, y: 0.5 };
const MEGA_OCTET = 1024 * 1024;
const classeBouton = "inline-flex items-center justify-center rounded-full border-2 border-encre px-[18px] py-2 text-[.9rem] font-semibold shadow-brut transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand active:translate-x-0.5 active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre";
const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function EditeurImageLieu({ lieuId, quelle, actuelle, connue, brouillon, onBrouillon, onEnregistree }: Props) {
  const langue = utiliserLangue();
  const T = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE);
  const TI = T.images[quelle];
  const regle = REGLES_IMAGES_LIEU[quelle];
  const [occupation, setOccupation] = useState<Occupation | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [message, setMessage] = useState<EtatMessageImageLieu | null>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const titreRecadrage = useRef<HTMLHeadingElement>(null);
  const zoneMessage = useRef<HTMLDivElement>(null);
  const questionRetrait = useRef<HTMLParagraphElement>(null);
  const boutonRetirer = useRef<HTMLButtonElement>(null);
  const retourAuBouton = useRef(false);
  const sourcePrecedente = useRef<ImageBitmap | undefined>(undefined);
  const idTitre = useId();
  const idConseils = useId();
  const idMessage = useId();
  const decrireChoix = `${idConseils} ${idMessage}`;
  const source = brouillon?.source;

  useEffect(() => () => source?.close(), [source]);
  useEffect(() => {
    if (source && source !== sourcePrecedente.current) titreRecadrage.current?.focus();
    else if (!source && sourcePrecedente.current) titre.current?.focus();
    sourcePrecedente.current = source;
  }, [source]);
  useEffect(() => {
    if (message) zoneMessage.current?.focus();
  }, [message]);
  useEffect(() => {
    if (confirmation) questionRetrait.current?.focus();
    else if (retourAuBouton.current) boutonRetirer.current?.focus();
    retourAuBouton.current = false;
  }, [confirmation]);

  const signalerEchec = (reponse: Extract<ReponseImageLieu, { ok: false }>) =>
    setMessage({ ok: false, ...choisirMessageImageLieu(reponse.erreur, reponse.jusqua, langue), connexion: reponse.erreur === "session-expiree" });

  async function choisir(fichier: File) {
    setMessage(null);
    setConfirmation(false);
    setOccupation("ouverture");
    const ouverte = await ouvrirImageLocale(fichier);
    setOccupation(null);
    if (!ouverte.ok) {
      const texte = ouverte.erreur === "poids" ? T.erreurs.poids(POIDS_MAX_IMAGE_SOURCE / MEGA_OCTET) : T.erreurs[ouverte.erreur];
      setMessage({ ok: false, texte, connexion: false });
      return;
    }
    onBrouillon({ source: ouverte.image, reglage: REGLAGE_DEPART });
  }

  async function envoyer() {
    if (!brouillon) return;
    setMessage(null);
    setOccupation("envoi");
    const cadre = calculerCadreRecadrage({ largeur: brouillon.source.width, hauteur: brouillon.source.height }, regle, brouillon.reglage);
    const exportee = await exporterImageLieu(brouillon.source, cadre, quelle);
    if (!exportee.ok) {
      setOccupation(null);
      if (exportee.erreur === "trop-lourde") signalerEchec({ ok: false, erreur: "image-lieu-trop-lourde", jusqua: null });
      else setMessage({ ok: false, texte: T.erreurs.encodage, connexion: false });
      return;
    }
    const reponse = await appelerRouteImageLieu(lieuId, quelle, exportee.image);
    setOccupation(null);
    if (!reponse.ok) return signalerEchec(reponse);
    onEnregistree(reponse.adresse, reponse.adresse !== null);
    onBrouillon(null);
    setMessage({ ok: true, texte: TI.envoyee, connexion: false });
  }

  async function retirer() {
    setConfirmation(false);
    setMessage(null);
    setOccupation("retrait");
    const reponse = await appelerRouteImageLieu(lieuId, quelle, null);
    setOccupation(null);
    if (!reponse.ok) return signalerEchec(reponse);
    onEnregistree(null, true);
    setMessage({ ok: true, texte: TI.retiree, connexion: false });
  }

  function annuler() {
    setMessage(null);
    onBrouillon(null);
  }

  const statut = occupation && (
    <p role="status" className="font-semibold text-gris">
      <span aria-hidden="true" className="mr-2 inline-block size-3 animate-pulse rounded-full bg-jaune align-middle" />
      {T.statuts[occupation]}
    </p>
  );

  return (
    <section aria-labelledby={idTitre} className="min-w-0 rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-7">
      <h2 id={idTitre} ref={titre} tabIndex={-1} className="font-titre text-2xl font-extrabold focus:outline-none">{TI.titre}</h2>
      <p className="mt-1 text-sm text-gris">{lierPonctuation(TI.format(regle.largeur, regle.hauteur))}</p>
      <ul id={idConseils} className="mt-4 grid gap-1.5 text-sm">
        {TI.conseils.map((conseil) => (
          <li key={conseil} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-1">
            <span aria-hidden="true">•</span>
            <span>{lierPonctuation(conseil)}</span>
          </li>
        ))}
      </ul>

      {brouillon ? (
        <div className="mt-6 grid gap-4">
          <h3 ref={titreRecadrage} tabIndex={-1} className="text-lg font-extrabold focus:outline-none">{T.recadrage.titre}</h3>
          <RecadrageImage quelle={quelle} source={brouillon.source} reglage={brouillon.reglage} onReglage={(reglage) => onBrouillon({ ...brouillon, reglage })} />
          {statut || (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={envoyer} className={`${classeBouton} bg-jaune text-encre`}>{TI.envoyer}</button>
              <ChoixFichierImage variante="blanc" description={decrireChoix} onFichier={choisir}>{T.boutons.autre}</ChoixFichierImage>
              <button type="button" onClick={annuler} className={classeLien}>{T.boutons.annuler}</button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <p className="font-semibold">{lierPonctuation(!connue ? TI.inconnue : actuelle ? TI.enLigne : TI.aucune)}</p>
          {confirmation ? (
            <div className="rounded-2xl border-2 border-encre bg-rose-alerte p-4">
              <p ref={questionRetrait} tabIndex={-1} className="font-semibold focus:outline-none">{lierPonctuation(TI.confirmer)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={retirer} className={`${classeBouton} bg-rouge-texte text-white`}>{T.boutons.confirmer}</button>
                <button
                  type="button"
                  onClick={() => {
                    retourAuBouton.current = true;
                    setConfirmation(false);
                  }}
                  className={`${classeBouton} bg-white text-encre`}
                >
                  {T.boutons.garder}
                </button>
              </div>
            </div>
          ) : statut || (
            <div className="flex flex-wrap items-center gap-3">
              <ChoixFichierImage description={decrireChoix} onFichier={choisir}>
                {actuelle || !connue ? T.boutons.changer : T.boutons.choisir}
                {(actuelle || !connue) && <span className="sr-only">{TI.precision}</span>}
              </ChoixFichierImage>
              {(actuelle || !connue) && (
                <button
                  ref={boutonRetirer}
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setConfirmation(true);
                  }}
                  className={`${classeBouton} bg-white text-encre`}
                >
                  {T.boutons.retirer}
                  <span className="sr-only">{TI.precision}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <MessageImageLieu ref={zoneMessage} id={idMessage} message={message} lieuId={lieuId} />
    </section>
  );
}
