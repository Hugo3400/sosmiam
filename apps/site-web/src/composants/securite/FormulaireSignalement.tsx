import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Form, Link, useActionData, useLocation, useNavigation } from "react-router";

import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import {
  CIBLES_SIGNALEMENT_SECURITE,
  IMAGE_SIGNALEMENT_OCTETS_MAX,
  IMAGES_SIGNALEMENT_MAX,
  LONGUEURS_SIGNALEMENT_SECURITE as LONGUEURS,
} from "../../../../../packages/commun/src/regles/securite.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { CaseSignalement } from "~/composants/securite/CaseSignalement";
import {
  LIEN_DONNEES_SECURITE,
  LONGUEUR_MAX_EMAIL_SIGNALEMENT,
  TEXTES_FORMULAIRE_SECURITE_PAR_LANGUE,
  type ChampSignalement,
} from "~/contenus/formulaire-securite";
import type { ValeursSignalement } from "~/fonctions/securite/lire-formulaire-signalement";
import { ecrireMessageService } from "~/fonctions/texte/ecrire-message-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export type ReponseSignalement =
  | { ok: true }
  | {
      ok: false;
      message: string;
      champ?: ChampSignalement;
      erreurs?: Partial<Record<ChampSignalement, string>>;
      valeurs?: ValeursSignalement;
      imagesARemettre?: boolean;
    };

const classeChamp = "w-full rounded-2xl border-2 border-encre bg-white px-4 py-3 font-medium focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte";
const classeLibelle = "mb-1.5 block text-sm font-semibold";
const classeAide = "mb-2 text-sm text-gris";
function verifierImages(fichiers: File[], langue: Langue): string | null {
  if (fichiers.length > IMAGES_SIGNALEMENT_MAX) return lierPonctuation(ecrireMessageService("trop-d-images", langue));
  if (fichiers.some((fichier) => fichier.size > IMAGE_SIGNALEMENT_OCTETS_MAX)) return lierPonctuation(ecrireMessageService("image-trop-lourde", langue));
  const formatValable = (fichier: File) => ["image/png", "image/jpeg"].includes(fichier.type) || /\.(png|jpe?g)$/i.test(fichier.name);
  if (!fichiers.every(formatValable)) return lierPonctuation(ecrireMessageService("image-format", langue));
  return null;
}

export function FormulaireSignalement() {
  const T = utiliserTextes(TEXTES_FORMULAIRE_SECURITE_PAR_LANGUE);
  const langue = utiliserLangue();
  const versLien = utiliserLienLangue();
  const { nom, email, cible, titre, description, lien, images, tableauHonneur, nomTableauHonneur, majeur, reglesAcceptees } = T.champs;
  const reponse = useActionData<ReponseSignalement>();
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const javascriptActif = utiliserJavascriptActif();
  const formulaire = useRef<HTMLFormElement>(null);
  const champImages = useRef<HTMLInputElement>(null);
  const refus = reponse && !reponse.ok ? reponse : undefined;
  const valeurs = refus?.valeurs;
  const [longueurDescription, setLongueurDescription] = useState(valeurs?.description.length ?? 0);
  const [imagesChoisies, setImagesChoisies] = useState<{ noms: string[]; erreur: string | null } | null>(null);
  const [enAttente, setEnAttente] = useState(false);
  const [numeroReponse, setNumeroReponse] = useState(0);

  useEffect(() => {
    if (!refus) return;
    setEnAttente(false);
    setNumeroReponse((numero) => numero + 1);
    const cibleFocus = refus.champ ? formulaire.current?.elements.namedItem(refus.champ) : null;
    if (cibleFocus instanceof HTMLElement) cibleFocus.focus();
  }, [refus]);

  function choisirImages(evenement: ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(evenement.currentTarget.files ?? []);
    setImagesChoisies(fichiers.length > 0 ? { noms: fichiers.map((fichier) => fichier.name), erreur: verifierImages(fichiers, langue) } : null);
  }

  function retirerImages() {
    if (champImages.current) champImages.current.value = "";
    setImagesChoisies(null);
    champImages.current?.focus();
  }

  function envoyer(evenement: FormEvent<HTMLFormElement>) {
    if (imagesChoisies?.erreur) {
      evenement.preventDefault();
      champImages.current?.focus();
      return;
    }
    setEnAttente(true);
  }

  const erreurDe = (champ: ChampSignalement) => (champ === "images" && imagesChoisies ? imagesChoisies.erreur : refus?.erreurs?.[champ]) ?? undefined;
  const idErreur = (champ: ChampSignalement) => `signalement-${champ}-erreur`;
  const decrit = (champ: ChampSignalement, ...autres: string[]) => [...autres, erreurDe(champ) ? idErreur(champ) : ""].filter(Boolean).join(" ") || undefined;
  const afficherErreur = (champ: ChampSignalement) =>
    erreurDe(champ) && <p id={idErreur(champ)} className="mt-1.5 text-sm font-semibold text-rouge-texte">{erreurDe(champ)}</p>;
  const libelle = (champ: ChampSignalement, texte: string, facultatif = false): ReactNode => (
    <label htmlFor={`signalement-${champ}`} className={classeLibelle}>
      {lierPonctuation(texte)}{facultatif && <span className="font-normal text-gris">{T.facultatif}</span>}
    </label>
  );
  const proprietesErreur = (champ: ChampSignalement, ...aides: string[]) => ({ "aria-invalid": Boolean(erreurDe(champ)), "aria-describedby": decrit(champ, ...aides) });
  const messageGeneral = refus && !enAttente ? refus.message : "";
  const imagesARemettre = Boolean(refus?.imagesARemettre) && !javascriptActif && !imagesChoisies;

  return (
    <Form
      ref={formulaire}
      method="post"
      action={javascriptActif ? undefined : `${pathname}#signaler`}
      encType="multipart/form-data"
      noValidate
      onSubmit={envoyer}
      className="relative rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {libelle("nom", nom.libelle)}
          <input id="signalement-nom" name="nom" type="text" autoComplete="nickname" required maxLength={LONGUEURS.nom.max} defaultValue={valeurs?.nom}
            {...proprietesErreur("nom")} className={classeChamp} />
          {afficherErreur("nom")}
        </div>
        <div>
          {libelle("email", email.libelle)}
          <p id="signalement-email-aide" className={classeAide}>{lierPonctuation(email.aide)}</p>
          <input id="signalement-email" name="email" type="email" autoComplete="email" required maxLength={LONGUEUR_MAX_EMAIL_SIGNALEMENT} defaultValue={valeurs?.email}
            placeholder={email.exemple} {...proprietesErreur("email", "signalement-email-aide")} className={classeChamp} />
          {afficherErreur("email")}
        </div>
        <div className="sm:col-span-2">
          {libelle("cible", cible.libelle)}
          <select id="signalement-cible" name="cible" required defaultValue={valeurs?.cible ?? ""} {...proprietesErreur("cible")} className={classeChamp}>
            <option value="" disabled>{cible.choisir}</option>
            {CIBLES_SIGNALEMENT_SECURITE.map((valeur) => <option key={valeur} value={valeur}>{T.cibles[valeur]}</option>)}
          </select>
          {afficherErreur("cible")}
        </div>
        <div className="sm:col-span-2">
          {libelle("titre", titre.libelle)}
          <p id="signalement-titre-aide" className={classeAide}>{lierPonctuation(titre.aide)}</p>
          <input id="signalement-titre" name="titre" type="text" autoComplete="off" required maxLength={LONGUEURS.titre.max} defaultValue={valeurs?.titre}
            {...proprietesErreur("titre", "signalement-titre-aide")} className={classeChamp} />
          {afficherErreur("titre")}
        </div>
        <div className="sm:col-span-2">
          {libelle("description", description.libelle)}
          <p id="signalement-description-aide" className={classeAide}>{lierPonctuation(description.aide)}</p>
          <textarea id="signalement-description" name="description" rows={10} required maxLength={LONGUEURS.description.max} defaultValue={valeurs?.description}
            onChange={(evenement) => setLongueurDescription(evenement.currentTarget.value.length)}
            {...proprietesErreur("description", "signalement-description-aide", "signalement-description-compteur")} className={`${classeChamp} font-mono text-sm`} />
          <p id="signalement-description-compteur" className="mt-1 text-right text-xs text-gris">{T.compteur(longueurDescription, LONGUEURS.description.max)}</p>
          {afficherErreur("description")}
        </div>
        <div className="sm:col-span-2">
          {libelle("lien", lien.libelle, true)}
          <p id="signalement-lien-aide" className={classeAide}>{lierPonctuation(lien.aide)}</p>
          <input id="signalement-lien" name="lien" type="url" inputMode="url" autoComplete="off" maxLength={LONGUEURS.lien.max} defaultValue={valeurs?.lien}
            placeholder="https://" {...proprietesErreur("lien", "signalement-lien-aide")} className={classeChamp} />
          {afficherErreur("lien")}
        </div>
        <div className="sm:col-span-2">
          {libelle("images", images.libelle, true)}
          <p id="signalement-images-aide" className={classeAide}>{lierPonctuation(images.aide)}</p>
          {imagesARemettre && <p className="mb-2 rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">{lierPonctuation(images.aRemettre)}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <input ref={champImages} id="signalement-images" name="images" type="file" multiple accept="image/png,image/jpeg" onChange={choisirImages}
              {...proprietesErreur("images", "signalement-images-aide")}
              className="w-full max-w-full rounded-2xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-2 file:border-encre file:bg-jaune file:px-4 file:py-1.5 file:font-semibold sm:w-auto sm:grow focus:outline-3 focus:outline-offset-2 focus:outline-encre aria-invalid:border-rouge-texte" />
            {imagesChoisies && <Bouton petit variante="blanc" onClick={retirerImages}>{images.retirer}</Bouton>}
          </div>
          {imagesChoisies && imagesChoisies.noms.length > 1 && (
            <ul aria-label={images.choisies} className="mt-2 flex flex-wrap gap-2 text-sm">
              {imagesChoisies.noms.map((nomImage, rang) => <li key={`${nomImage}-${rang}`} className="rounded-full bg-creme px-3 py-1">{nomImage}</li>)}
            </ul>
          )}
          {afficherErreur("images")}
        </div>
      </div>

      <fieldset className="mt-6 rounded-2xl border-2 border-encre bg-creme p-5">
        <legend className="px-2 font-titre text-lg font-extrabold"><span aria-hidden="true">🏆 </span>{T.legendeTableauHonneur}</legend>
        <CaseSignalement nom="tableauHonneur" libelle={tableauHonneur.libelle} coche={valeurs?.tableauHonneur} />
        <div className="mt-4">
          {libelle("nomTableauHonneur", nomTableauHonneur.libelle, true)}
          <p id="signalement-nomTableauHonneur-aide" className={classeAide}>{lierPonctuation(nomTableauHonneur.aide)}</p>
          <input id="signalement-nomTableauHonneur" name="nomTableauHonneur" type="text" autoComplete="off" maxLength={LONGUEURS.nomTableauHonneur.max}
            defaultValue={valeurs?.nomTableauHonneur} {...proprietesErreur("nomTableauHonneur", "signalement-nomTableauHonneur-aide")} className={classeChamp} />
          {afficherErreur("nomTableauHonneur")}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col gap-4">
        <CaseSignalement nom="majeur" libelle={majeur.libelle} coche={valeurs?.majeur} requise erreur={erreurDe("majeur")} />
        <CaseSignalement nom="reglesAcceptees" libelle={reglesAcceptees.libelle} coche={valeurs?.reglesAcceptees} requise erreur={erreurDe("reglesAcceptees")}>
          <a href="#regles" className="ml-9 text-sm font-semibold underline underline-offset-2">{reglesAcceptees.relire}</a>
        </CaseSignalement>
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
        <label htmlFor="signalement-site-web">{T.piege}</label>
        <input id="signalement-site-web" type="text" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="mt-6 rounded-xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm">
        {lierPonctuation(T.donnees)}
        <Link to={versLien(LIEN_DONNEES_SECURITE)} className="font-semibold underline underline-offset-2">{T.enSavoirPlus}</Link>
      </p>

      <p role="status" aria-live="polite" className="mt-6 min-h-6 font-semibold text-rouge-texte"><span key={numeroReponse}>{messageGeneral}</span></p>
      <Bouton type="submit" className="mt-2 w-full sm:w-auto sm:min-w-64">{navigation.state === "submitting" ? T.messages.envoi : T.messages.envoyer}</Bouton>
    </Form>
  );
}
