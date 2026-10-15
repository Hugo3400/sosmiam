import { Save } from "lucide-react";
import { useState } from "react";

import { CIBLES_ANNONCE_APP, TEXTE_ANNONCE_APP_MAX, TITRE_ANNONCE_APP_MAX, type CibleAnnonceApp } from "../../../../../packages/commun/src/regles/annonces-app.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { ECRANS_APP } from "~/contenus/ecrans-app.ts";
import { isoVersSaisie } from "~/fonctions/dates/iso-vers-saisie.ts";
import { saisieVersIso } from "~/fonctions/dates/saisie-vers-iso.ts";
import { parleDAlcool } from "~/fonctions/pop-ups/parle-d-alcool.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { creerPopUp, modifierPopUp, type PopUpApp } from "~/services/pop-ups-app.ts";
import { ApercuPopUp } from "./ApercuPopUp.tsx";

const LIBELLES_CIBLE: Record<CibleAnnonceApp, string> = { tous: "Tout le monde", ville: "Une ville", pros: "Les pros", ambassadeurs: "Les ambassadeurs" };
const NOMS_CHAMPS: Record<string, string> = { titre: "le titre", texte: "le texte", boutonLibelle: "le texte du bouton", boutonLien: "l'écran du bouton", ville: "la ville", debut: "le début", fin: "la fin" };

type Props = { popUp: PopUpApp | null; onFermer: () => void; onEnregistree: (message: string) => void };

export function FormulairePopUp({ popUp, onFermer, onEnregistree }: Props) {
  const lienDepart = popUp?.boutonLien ?? "/";
  const lieuDepart = lienDepart.match(/^\/lieu\/(\d+)$/)?.[1] ?? "";
  const [titre, setTitre] = useState(popUp?.titre ?? "");
  const [texte, setTexte] = useState(popUp?.texte ?? "");
  const [emoji, setEmoji] = useState(popUp?.emoji ?? "");
  const [avecBouton, setAvecBouton] = useState(Boolean(popUp?.boutonLibelle));
  const [boutonLibelle, setBoutonLibelle] = useState(popUp?.boutonLibelle ?? "");
  const [ecran, setEcran] = useState(lieuDepart ? "lieu" : lienDepart);
  const [lieuId, setLieuId] = useState(lieuDepart);
  const [cible, setCible] = useState<CibleAnnonceApp>(popUp?.cible ?? "tous");
  const [ville, setVille] = useState(popUp?.ville ?? "");
  const [debut, setDebut] = useState(isoVersSaisie(popUp?.debut ?? null));
  const [fin, setFin] = useState(isoVersSaisie(popUp?.fin ?? null));
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  const lien = ecran === "lieu" ? (lieuId ? `/lieu/${lieuId}` : null) : ecran;
  const toutPublic = cible === "tous" || cible === "ville";
  const alcool = parleDAlcool(`${titre} ${texte} ${boutonLibelle}`);
  const pret = titre.trim() && texte.trim() && (cible !== "ville" || ville.trim()) && (!avecBouton || (boutonLibelle.trim() && lien));

  async function enregistrer() {
    setEtat({ enCours: true, erreur: null });
    const saisie = {
      titre: titre.trim(), texte: texte.trim(), emoji: emoji.trim() || null,
      boutonLibelle: avecBouton ? boutonLibelle.trim() : null, boutonLien: avecBouton ? lien : null,
      cible, ville: cible === "ville" ? ville.trim() : null, debut: debut ? saisieVersIso(debut) : null, fin: fin ? saisieVersIso(fin) : null,
    };
    try {
      if (popUp) await modifierPopUp(popUp.id, saisie);
      else await creerPopUp(saisie);
      onEnregistree(popUp ? "Pop-up modifiée ✅" : "Pop-up enregistrée en brouillon ✅ : publie-la quand elle te va.");
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ ? `Vérifie ${NOMS_CHAMPS[erreur.champ] ?? erreur.champ}.` : expliquerErreur(erreur) });
    }
  }

  return (
    <Modale
      large
      titre={popUp ? "Modifier la pop-up" : "Nouvelle pop-up"}
      ouverte
      onFermer={onFermer}
      actions={<><Bouton onClick={onFermer}>Annuler</Bouton><Bouton variante="principal" icone={Save} desactive={!pret} chargement={etat.enCours} onClick={enregistrer}>Enregistrer</Bouton></>}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid content-start gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem]">
            <Champ libelle="Titre" valeur={titre} onChange={setTitre} maxLength={TITRE_ANNONCE_APP_MAX} aide={`${titre.length} / ${TITRE_ANNONCE_APP_MAX}`} placeholder="Lyon, c'est parti ! 🛟" className="w-full min-w-0" />
            <Champ libelle="Emoji" valeur={emoji} onChange={setEmoji} maxLength={8} placeholder="🎉" className="w-full min-w-0" />
          </div>
          <ZoneTexte libelle="Texte" valeur={texte} onChange={setTexte} maximum={TEXTE_ANNONCE_APP_MAX} lignes={4} placeholder="Les premiers lieux de Lyon sont en ligne : viens les découvrir et donne-leur un coup de main." />
          <div className="grid gap-3">
            <Onglets libelle="Bouton" valeur={avecBouton ? "oui" : "non"} onChange={(v) => setAvecBouton(v === "oui")} options={[{ valeur: "non", libelle: "Sans bouton" }, { valeur: "oui", libelle: "Avec un bouton" }]} />
            {avecBouton && (
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]">
                <Champ libelle="Texte du bouton" valeur={boutonLibelle} onChange={setBoutonLibelle} maxLength={30} placeholder="Voir les lieux" className="w-full min-w-0" />
                <Selecteur libelle="Ouvre dans l'app" valeur={ecran} onChange={setEcran} options={ECRANS_APP} className="w-full" />
                {ecran === "lieu" && <Champ libelle="N° du lieu" type="number" min={1} valeur={lieuId} onChange={setLieuId} className="w-full min-w-0" />}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Onglets libelle="Pour qui" valeur={cible} onChange={setCible} options={CIBLES_ANNONCE_APP.map((valeur) => ({ valeur, libelle: LIBELLES_CIBLE[valeur] }))} />
            {cible === "ville" && <Champ libelle="Ville" valeur={ville} onChange={setVille} placeholder="Lyon" className="w-48" />}
          </div>
          <p className="text-[13px] text-gris">
            {cible === "tous" && "Tout le monde, même sans compte (visite tout public)."}
            {cible === "ville" && "Ceux qui ont choisi cette ville dans l'app, même sans compte."}
            {cible === "pros" && "Les comptes qui gèrent un lieu (rattachement validé)."}
            {cible === "ambassadeurs" && "Les ambassadeurs actifs."}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Champ libelle="Début (vide : dès la publication)" type="datetime-local" valeur={debut} onChange={setDebut} className="w-full min-w-0" />
            <Champ libelle="Fin (vide : jusqu'au retrait)" type="datetime-local" valeur={fin} onChange={setFin} className="w-full min-w-0" />
          </div>
          {alcool && (
            <p role="alert" className="rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">
              {toutPublic
                ? "Cette pop-up parle de bar ou d'alcool, et elle sera vue sans compte (visite tout public, sans alcool). Choisis plutôt une cible avec compte, ou change le texte."
                : "Cette pop-up parle d'alcool : c'est de la publicité pour l'alcool (loi Évin). Pas de publication sans l'avis d'un juriste et le message sanitaire."}
            </p>
          )}
          {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
        </div>
        <ApercuPopUp titre={titre} texte={texte} emoji={emoji} bouton={avecBouton ? boutonLibelle : ""} />
      </div>
    </Modale>
  );
}
