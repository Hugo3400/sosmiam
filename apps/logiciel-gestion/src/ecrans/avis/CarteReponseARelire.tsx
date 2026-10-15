import { Bouton } from "~/composants/interface/Bouton.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { trancherReponseAvis, type ReponseARelire } from "~/services/avis.ts";
import { ActionsAvis } from "./ActionsAvis.tsx";

type Props = { reponse: ReponseARelire; onDecide: () => void; ouvrirCompte: (id: number) => void };

/** La réponse publique d'un lieu à un avis : déjà en ligne, relue après coup. */
export function CarteReponseARelire({ reponse: r, onDecide, ouvrirCompte }: Props) {
  return (
    <li className="flex flex-col gap-4 rounded-carte border border-ligne bg-white p-4 lg:flex-row">
      <div className="grid min-w-0 flex-1 gap-2">
        <p className="font-titre text-base font-extrabold">{r.lieu.emoji} {r.lieu.nom} <span className="font-texte text-[13px] font-normal text-gris">· {r.lieu.ville}</span></p>
        <p className="text-[13px] text-gris">L'avis ({r.note}/5, {r.signature}{r.statut === "masque" ? ", masqué" : ""}) :</p>
        <p className="rounded-xl bg-creme px-3 py-2 text-[13px] whitespace-pre-line text-gris">{r.texte}</p>
        <p className="text-[13px] font-semibold">La réponse du lieu, {formaterDate(r.reponseLe, true)} :</p>
        <p className="rounded-xl border border-ligne px-3 py-2 text-sm whitespace-pre-line">{r.reponseTexte}</p>
        {r.reponseParId && <div><Bouton petit variante="discret" onClick={() => ouvrirCompte(r.reponseParId!)}>Voir le compte qui a répondu (n° {r.reponseParId})</Bouton></div>}
      </div>
      <ActionsAvis
        le="la réponse du lieu"
        siMasque="La réponse disparaît sous l'avis. Le compte qui l'a écrite reçoit la règle enfreinte et ton explication, et peut contester pendant 6 mois."
        trancher={(decision) => trancherReponseAvis(r.id, decision)}
        onDecide={onDecide}
      />
    </li>
  );
}
