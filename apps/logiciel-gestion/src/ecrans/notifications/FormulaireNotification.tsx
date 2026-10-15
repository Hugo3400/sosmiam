import { Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ECRANS_APP } from "~/contenus/ecrans-app.ts";
import { saisieVersIso } from "~/fonctions/dates/saisie-vers-iso.ts";
import { parleDAlcool } from "~/fonctions/pop-ups/parle-d-alcool.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { creerNotification, estimerNotification, type CiblePush } from "~/services/notifications.ts";
import { ApercuNotification } from "./ApercuNotification.tsx";


/** Écrire une notification : texte, écran ouvert, à qui, quand ; l'estimation dit combien la recevront vraiment. */
export function FormulaireNotification({ onEnvoyee }: { onEnvoyee: (bilan: string) => void }) {
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [ecran, setEcran] = useState("/");
  const [lieuId, setLieuId] = useState("");
  const [sorte, setSorte] = useState<"" | "info" | "offre">("");
  const [cible, setCible] = useState<CiblePush>({ ville: "", plateforme: "", offres: false });
  const [cibleStable, setCibleStable] = useState(cible);
  const [quand, setQuand] = useState<"maintenant" | "plus-tard">("maintenant");
  const [date, setDate] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  useEffect(() => {
    const minuteur = setTimeout(() => setCibleStable(cible), 300);
    return () => clearTimeout(minuteur);
  }, [cible]);
  const estimation = utiliserChargement(() => estimerNotification(cibleStable), [cibleStable.ville, cibleStable.plateforme, cibleStable.offres]);
  const lien = ecran === "lieu" ? (lieuId ? `/lieu/${lieuId}` : null) : ecran;
  const programmeeLe = quand === "plus-tard" ? saisieVersIso(date) : null;
  const pret = sorte && titre.trim() && texte.trim() && (ecran !== "lieu" || lieuId) && (quand === "maintenant" || programmeeLe);
  const recevront = estimation.donnees ? estimation.donnees.total - estimation.donnees.antiSpam : null;

  async function envoyer() {
    const question = quand === "maintenant" ? `Envoyer maintenant « ${titre} » à ${recevront ?? "?"} téléphone(s) ?` : `Programmer « ${titre} » ?`;
    if (!window.confirm(question)) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await creerNotification({ ...cible, titre: titre.trim(), texte: texte.trim(), lien, programmeeLe });
      setTitre("");
      setTexte("");
      setSorte("");
      setCible({ ...cible, offres: false });
      setEtat({ enCours: false, erreur: null });
      onEnvoyee(quand === "maintenant" ? "Notification en route ✅" : "Notification programmée ✅");
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <Carte titre="Nouvelle notification">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-4">
          <Champ libelle="Titre" valeur={titre} onChange={setTitre} maxLength={60} placeholder="Ce soir, ça bouge 🛟" aide={`${titre.length} / 60`} className="w-full min-w-0" />
          <Champ libelle="Texte" valeur={texte} onChange={setTexte} maxLength={180} placeholder="Trois lieux ont de la place près de chez toi : viens les sauver !" aide={`${texte.length} / 180`} className="w-full min-w-0" />
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
            <Selecteur libelle="Ouvre dans l'app" valeur={ecran} onChange={setEcran} options={ECRANS_APP} className="w-full" />
            {ecran === "lieu" && <Champ libelle="N° du lieu" type="number" min={1} valeur={lieuId} onChange={setLieuId} className="w-full min-w-0" />}
          </div>
          <div className="grid gap-1.5">
            <Onglets
              libelle="Sorte de notification"
              valeur={sorte}
              onChange={(valeur) => (setSorte(valeur), setCible({ ...cible, offres: valeur === "offre" }))}
              options={[{ valeur: "info", libelle: "Info utile" }, { valeur: "offre", libelle: "Promotionnelle (offres, bons plans)" }]}
            />
            <p className="text-[13px] text-gris">
              {sorte === "offre"
                ? "Seulement les téléphones qui ont accepté les offres dans l'app (Apple l'exige)."
                : sorte === "info" ? "Une info sans promotion : nouveauté, ville qui ouvre, BIG SOS…" : "À choisir avant d'envoyer."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Champ libelle="Ville (facultatif)" valeur={cible.ville} onChange={(ville) => setCible({ ...cible, ville })} placeholder="Toutes" className="w-full min-w-0" />
            <Selecteur
              libelle="Téléphones"
              valeur={cible.plateforme}
              onChange={(plateforme) => setCible({ ...cible, plateforme })}
              options={[{ valeur: "", libelle: "iPhone et Android" }, { valeur: "ios", libelle: "iPhone seulement" }, { valeur: "android", libelle: "Android seulement" }]}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Onglets libelle="Quand" valeur={quand} onChange={setQuand} options={[{ valeur: "maintenant", libelle: "Maintenant" }, { valeur: "plus-tard", libelle: "Programmer" }]} />
            {quand === "plus-tard" && <Champ libelle="Le" type="datetime-local" valeur={date} onChange={setDate} className="w-56" />}
          </div>
          <p className="rounded-xl bg-creme px-3 py-2 text-sm">
            {estimation.donnees
              ? <>Recevront : <strong className="chiffres">{formaterNombre(recevront ?? 0)}</strong> téléphone(s) sur {formaterNombre(estimation.donnees.total)}
                  {estimation.donnees.antiSpam > 0 && <> · {formaterNombre(estimation.donnees.antiSpam)} laissé(s) de côté par l'anti-spam (déjà servis : 1 par jour, 4 par semaine)</>}.</>
              : "Calcul…"}
          </p>
          {parleDAlcool(`${titre} ${texte}`) && (
            <p role="alert" className="rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">
              Ça parle d'alcool : en notification, c'est de la publicité pour l'alcool (loi Évin). Pas d'envoi sans l'avis d'un juriste et le message sanitaire.
            </p>
          )}
          {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
          <Bouton variante="principal" icone={Send} desactive={!pret} chargement={etat.enCours} onClick={envoyer} className="justify-self-start">
            {quand === "maintenant" ? "Envoyer" : "Programmer"}
          </Bouton>
        </div>
        <ApercuNotification titre={titre} texte={texte} />
      </div>
    </Carte>
  );
}
