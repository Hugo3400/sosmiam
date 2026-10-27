import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Form, Link, useActionData, useLocation, useNavigation } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { LIMITES_CANDIDATURE, TAILLE_MAX_CV, TEXTES_CANDIDATURE_PAR_LANGUE, type ChampCandidature } from "~/contenus/carriere";
import type { ValeursCandidature } from "~/fonctions/carriere/lire-formulaire-candidature";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export type ReponseCandidature =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      champ?: ChampCandidature;
      erreurs?: Partial<Record<ChampCandidature, string>>;
      valeurs?: ValeursCandidature;
      cvARemettre?: boolean;
    };

const classeChamp = "w-full rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte";
const classeLibelle = "mb-1.5 block text-sm font-semibold";
const classeErreur = "mt-1.5 text-sm font-semibold text-rouge-texte";
function verifierFichierCv(fichier: File | undefined, erreurs: { erreurFormat: string; erreurPoids: string }): string | null {
  if (!fichier) return null;
  if (fichier.type !== "application/pdf" && !/\.pdf$/i.test(fichier.name)) return lierPonctuation(erreurs.erreurFormat);
  if (fichier.size > TAILLE_MAX_CV) return lierPonctuation(erreurs.erreurPoids);
  return null;
}

export function FormulaireCandidature() {
  const T = utiliserTextes(TEXTES_CANDIDATURE_PAR_LANGUE);
  const { nom, email, message, lien, cv, majeur } = T.champs;
  const lienLangue = utiliserLienLangue();
  const reponse = useActionData<ReponseCandidature>();
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const javascriptActif = utiliserJavascriptActif();
  const formulaire = useRef<HTMLFormElement>(null);
  const champCv = useRef<HTMLInputElement>(null);
  const refus = reponse && !reponse.ok ? reponse : undefined;
  const valeurs = refus?.valeurs;
  const [longueurMessage, setLongueurMessage] = useState(valeurs?.message.length ?? 0);
  const [cvChoisi, setCvChoisi] = useState<{ nom: string; erreur: string | null } | null>(null);
  const [enAttente, setEnAttente] = useState(false);
  const [numeroReponse, setNumeroReponse] = useState(0);

  useEffect(() => {
    if (!refus) return;
    setEnAttente(false);
    setNumeroReponse((numero) => numero + 1);
    const cible = refus.champ ? formulaire.current?.elements.namedItem(refus.champ) : null;
    if (cible instanceof HTMLElement) cible.focus();
  }, [refus]);

  function choisirCv(evenement: ChangeEvent<HTMLInputElement>) {
    const fichier = evenement.currentTarget.files?.[0];
    setCvChoisi(fichier ? { nom: fichier.name, erreur: verifierFichierCv(fichier, cv) } : null);
  }

  function retirerCv() {
    if (champCv.current) champCv.current.value = "";
    setCvChoisi(null);
    champCv.current?.focus();
  }

  function envoyer(evenement: FormEvent<HTMLFormElement>) {
    if (cvChoisi?.erreur) {
      evenement.preventDefault();
      champCv.current?.focus();
      return;
    }
    setEnAttente(true);
  }

  const erreurDe = (champ: ChampCandidature) => (champ === "cv" && cvChoisi ? cvChoisi.erreur : refus?.erreurs?.[champ]) ?? undefined;
  const decrit = (champ: ChampCandidature, ...autres: string[]) =>
    [...autres, erreurDe(champ) ? `candidature-${champ}-erreur` : ""].filter(Boolean).join(" ") || undefined;
  const afficherErreur = (champ: ChampCandidature) =>
    erreurDe(champ) && <p id={`candidature-${champ}-erreur`} className={classeErreur}>{erreurDe(champ)}</p>;
  const libelle = (champ: ChampCandidature, texte: string, facultatif = false): ReactNode => (
    <label htmlFor={`candidature-${champ}`} className={classeLibelle}>
      {texte}{facultatif && <span className="font-normal text-gris">{T.facultatif}</span>}
    </label>
  );
  const messageGeneral = refus && !enAttente ? refus.message : "";
  const cvARemettre = Boolean(refus?.cvARemettre) && !javascriptActif && !cvChoisi;

  return (
    <Form
      ref={formulaire}
      method="post"
      action={javascriptActif ? undefined : `${pathname}#candidater`}
      encType="multipart/form-data"
      noValidate
      onSubmit={envoyer}
      className="relative rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {libelle("nom", nom.libelle)}
          <input id="candidature-nom" name="nom" type="text" autoComplete="name" required maxLength={LIMITES_CANDIDATURE.nom.maximum} defaultValue={valeurs?.nom}
            aria-invalid={Boolean(erreurDe("nom"))} aria-describedby={decrit("nom")} className={classeChamp} />
          {afficherErreur("nom")}
        </div>
        <div>
          {libelle("email", email.libelle)}
          <input id="candidature-email" name="email" type="email" autoComplete="email" required maxLength={LIMITES_CANDIDATURE.email.maximum} defaultValue={valeurs?.email}
            placeholder={email.exemple} aria-invalid={Boolean(erreurDe("email"))} aria-describedby={decrit("email")} className={classeChamp} />
          {afficherErreur("email")}
        </div>
        <div className="sm:col-span-2">
          {libelle("message", message.libelle)}
          <p id="candidature-message-aide" className="mb-2 text-sm text-gris">{lierPonctuation(message.aide)}</p>
          <textarea id="candidature-message" name="message" rows={7} required maxLength={LIMITES_CANDIDATURE.message.maximum} defaultValue={valeurs?.message}
            onChange={(evenement) => setLongueurMessage(evenement.currentTarget.value.length)}
            aria-invalid={Boolean(erreurDe("message"))} aria-describedby={decrit("message", "candidature-message-aide", "candidature-message-compteur")}
            className={classeChamp} />
          <p id="candidature-message-compteur" className="mt-1 text-right text-xs text-gris">{T.compteur(longueurMessage, LIMITES_CANDIDATURE.message.maximum)}</p>
          {afficherErreur("message")}
        </div>
        <div className="sm:col-span-2">
          {libelle("lien", lien.libelle, true)}
          <p id="candidature-lien-aide" className="mb-2 text-sm text-gris">{lierPonctuation(lien.aide)}</p>
          <input id="candidature-lien" name="lien" type="url" inputMode="url" autoComplete="url" maxLength={LIMITES_CANDIDATURE.lien.maximum} defaultValue={valeurs?.lien}
            placeholder={lien.exemple} aria-invalid={Boolean(erreurDe("lien"))} aria-describedby={decrit("lien", "candidature-lien-aide")}
            className={classeChamp} />
          {afficherErreur("lien")}
        </div>
        <div className="sm:col-span-2">
          {libelle("cv", cv.libelle, true)}
          <p id="candidature-cv-aide" className="mb-2 text-sm text-gris">{lierPonctuation(cv.aide)}</p>
          {cvARemettre && <p className="mb-2 rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">{lierPonctuation(cv.aRemettre)}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <input ref={champCv} id="candidature-cv" name="cv" type="file" accept="application/pdf,.pdf" onChange={choisirCv}
              aria-invalid={Boolean(erreurDe("cv"))} aria-describedby={decrit("cv", "candidature-cv-aide")}
              className="w-full max-w-full rounded-2xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-2 file:border-encre file:bg-jaune file:px-4 file:py-1.5 file:font-semibold sm:w-auto sm:grow focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte" />
            {cvChoisi && <Bouton petit variante="blanc" onClick={retirerCv}>{T.retirerFichier}</Bouton>}
          </div>
          {afficherErreur("cv")}
        </div>
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 font-semibold">
          <input id="candidature-majeur" name="majeur" type="checkbox" value="oui" required defaultChecked={valeurs?.majeur}
            aria-invalid={Boolean(erreurDe("majeur"))} aria-describedby={decrit("majeur")}
            className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-encre focus:outline-3 focus:outline-offset-2 focus:outline-encre" />
          <span>{majeur.libelle}</span>
        </label>
        {afficherErreur("majeur")}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
        <label htmlFor="candidature-site-web">{T.piege}</label>
        <input id="candidature-site-web" type="text" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="mt-6 rounded-xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm">
        {lierPonctuation(T.conservation)}
        <Link to={lienLangue("/confidentialite#candidatures")} className="font-semibold underline underline-offset-2">{T.enSavoirPlus}</Link>
      </p>

      <p role="status" aria-live="polite" className="mt-6 min-h-6 font-semibold text-rouge-texte"><span key={numeroReponse}>{messageGeneral}</span></p>
      <Bouton type="submit" className="mt-2 w-full sm:w-auto sm:min-w-64">{navigation.state === "submitting" ? T.envoi : T.envoyer}</Bouton>
    </Form>
  );
}
