import { EyeOff, Globe, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { decrireEtatPopUp, type EtatPopUp } from "~/fonctions/pop-ups/decrire-etat-pop-up.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { publierPopUp, supprimerPopUp, type PopUpApp } from "~/services/pop-ups-app.ts";

const ETATS: Record<EtatPopUp, { libelle: string; ton: "vert" | "jaune" | "neutre" | "rouge" }> = {
  "en-ligne": { libelle: "En ligne", ton: "vert" },
  "a-venir": { libelle: "À venir", ton: "jaune" },
  brouillon: { libelle: "Brouillon", ton: "neutre" },
  finie: { libelle: "Finie", ton: "neutre" },
  retiree: { libelle: "Retirée", ton: "rouge" },
};
const CIBLES: Record<string, string> = { tous: "Tout le monde", pros: "Les pros", ambassadeurs: "Les ambassadeurs" };

type Props = { popUp: PopUpApp; onModifier: () => void; onChange: (message: string) => void };

export function CartePopUp({ popUp: p, onModifier, onChange }: Props) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const etat = decrireEtatPopUp(p);
  const enLigne = etat === "en-ligne" || etat === "a-venir";

  async function agir(action: () => Promise<unknown>, message: string) {
    setEnCours(true);
    setErreur(null);
    try {
      await action();
      onChange(message);
    } catch (probleme) {
      setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
      setEnCours(false);
    }
  }

  return (
    <li className="grid gap-2 rounded-carte border border-ligne bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">{p.emoji} {p.titre}</p>
        <Badge ton={ETATS[etat].ton}>{ETATS[etat].libelle}</Badge>
      </div>
      <p className="text-sm whitespace-pre-line">{p.texte}</p>
      <p className="text-[13px] text-gris">
        {p.cible === "ville" ? `Ville : ${p.ville}` : CIBLES[p.cible]} · du {formaterDate(p.debut, true)} {p.fin ? `au ${formaterDate(p.fin, true)}` : "jusqu'au retrait"}
        {p.boutonLibelle ? ` · bouton « ${p.boutonLibelle} » → ${p.boutonLien}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {!enLigne && etat !== "finie" && (
          <Bouton petit variante="principal" icone={Globe} chargement={enCours} onClick={() => window.confirm(`Publier « ${p.titre} » ?`) && agir(() => publierPopUp(p.id, true), "Pop-up publiée ✅")}>
            Publier
          </Bouton>
        )}
        {enLigne && <Bouton petit icone={EyeOff} chargement={enCours} onClick={() => agir(() => publierPopUp(p.id, false), "Pop-up retirée")}>Retirer</Bouton>}
        <Bouton petit icone={Pencil} onClick={onModifier}>Modifier</Bouton>
        {etat === "brouillon" && (
          <Bouton petit variante="danger" icone={Trash2} chargement={enCours} onClick={() => window.confirm("Supprimer ce brouillon ?") && agir(() => supprimerPopUp(p.id), "Brouillon supprimé")}>
            Supprimer
          </Bouton>
        )}
      </div>
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
    </li>
  );
}
