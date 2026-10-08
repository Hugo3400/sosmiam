import { Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { saisieVersIso } from "~/fonctions/dates/saisie-vers-iso.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { creerNotification, estimerNotification, type CiblePush } from "~/services/notifications.ts";
import { ApercuNotification } from "./ApercuNotification.tsx";

/** Les écrans de l'app qu'une notification peut ouvrir */
const ECRANS = [
  { valeur: "/", libelle: "Accueil (le fil « Pour toi »)" },
  { valeur: "/explorer", libelle: "Explorer (la carte des lieux)" },
  { valeur: "/potes", libelle: "Potes" },
  { valeur: "/profil", libelle: "Profil" },
  { valeur: "lieu", libelle: "Un lieu précis…" },
];

/** Écrire une notification : texte, écran ouvert, à qui, quand ; l'estimation dit combien la recevront vraiment. */
export function FormulaireNotification({ onEnvoyee }: { onEnvoyee: (bilan: string) => void }) {
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [ecran, setEcran] = useState("/");
  const [lieuId, setLieuId] = useState("");
  const [cible, setCible] = useState<CiblePush>({ ville: "", plateforme: "" });
  const [cibleStable, setCibleStable] = useState(cible);
  const [quand, setQuand] = useState<"maintenant" | "plus-tard">("maintenant");
  const [date, setDate] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  useEffect(() => {
    const minuteur = setTimeout(() => setCibleStable(cible), 300);
    return () => clearTimeout(minuteur);
  }, [cible]);
  const estimation = utiliserChargement(() => estimerNotification(cibleStable), [cibleStable.ville, cibleStable.plateforme]);
  const lien = ecran === "lieu" ? (lieuId ? `/lieu/${lieuId}` : null) : ecran;
  const programmeeLe = quand === "plus-tard" ? saisieVersIso(date) : null;
  const pret = titre.trim() && texte.trim() && (ecran !== "lieu" || lieuId) && (quand === "maintenant" || programmeeLe);
  const recevront = estimation.donnees ? estimation.donnees.total - estimation.donnees.antiSpam : null;

  async function envoyer() {
    const question = quand === "maintenant" ? `Envoyer maintenant « ${titre} » à ${recevront ?? "?"} téléphone(s) ?` : `Programmer « ${titre} » ?`;
    if (!window.confirm(question)) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await creerNotification({ ...cible, titre: titre.trim(), texte: texte.trim(), lien, programmeeLe });
      setTitre("");
      setTexte("");
      setEtat({ enCours: false, erreur: null });
      onEnvoyee(quand === "maintenant" ? "Notification en route : elle part dans les 30 secondes ✅" : "Notification programmée ✅");
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
            <Selecteur libelle="Ouvre dans l'app" valeur={ecran} onChange={setEcran} options={ECRANS} className="w-full" />
            {ecran === "lieu" && <Champ libelle="N° du lieu" type="number" min={1} valeur={lieuId} onChange={setLieuId} className="w-full min-w-0" />}
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
