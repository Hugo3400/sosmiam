import { MessageSquare, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import type { StatutIdee } from "../../../../../packages/commun/src/types/idees.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { STATUTS_IDEE } from "~/contenus/statuts-idees.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { changerStatutIdee, choisirIdeeDuMois, repondreIdee, supprimerIdee, type IdeeGestion } from "~/services/communaute.ts";
import { CommentairesIdee } from "./CommentairesIdee.tsx";

const moisEnCours = () => new Date().toISOString().slice(0, 7);
const moisEnLettres = (mois: string) => new Date(`${mois}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export function CarteIdee({ idee: i, onChange }: { idee: IdeeGestion; onChange: (message: string) => void }) {
  const [reponse, setReponse] = useState(i.reponseBrigade ?? "");
  const [ouverts, setOuverts] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const auteur = i.auteur ? (i.auteur.pseudo ? `@${i.auteur.pseudo}` : i.auteur.prenom) : "compte supprimé";
  const mois = moisEnCours();

  async function agir(action: () => Promise<unknown>, message: string) {
    setEtat({ enCours: true, erreur: null });
    try {
      await action();
      setEtat({ enCours: false, erreur: null });
      onChange(message);
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <li className="grid gap-3 rounded-carte border border-ligne bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">{i.titre}</p>
        {i.ideeDuMois && <Badge ton="jaune">⭐ Idée du mois ({moisEnLettres(i.ideeDuMois)})</Badge>}
        {i.suspendue && <Badge ton="jaune">Signalée</Badge>}
        {i.retiree && <Badge ton="rouge">Retirée</Badge>}
      </div>
      <p className="text-[13px] text-gris">Par {auteur} · {formaterDate(i.creeLe, true)} · {i.votes} vote{i.votes > 1 ? "s" : ""} · {i.commentaires} commentaire{i.commentaires > 1 ? "s" : ""}</p>
      {i.detail && <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{i.detail}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <Selecteur libelle="Statut" valeur={i.statut} onChange={(statut: StatutIdee) => agir(() => changerStatutIdee(i.id, statut), "Statut changé ✅")} options={STATUTS_IDEE} className="w-48" />
        {i.ideeDuMois !== mois && !i.retiree && (
          <Bouton petit icone={Star} chargement={etat.enCours} onClick={() => agir(() => choisirIdeeDuMois(i.id, mois), "Idée du mois choisie ⭐")}>
            Idée du mois ({moisEnLettres(mois)})
          </Bouton>
        )}
        <Bouton petit variante="discret" icone={MessageSquare} onClick={() => setOuverts(!ouverts)}>{ouverts ? "Cacher les commentaires" : "Commentaires"}</Bouton>
        <span className="ml-auto">
          <Bouton petit variante="danger" icone={Trash2} onClick={() => window.confirm(`Supprimer pour de bon l'idée « ${i.titre} » ?`) && agir(() => supprimerIdee(i.id), "Idée supprimée")}>Supprimer</Bouton>
        </span>
      </div>
      <div className="grid gap-2">
        <ZoneTexte libelle="Réponse de la Brigade (visible dans l'app)" valeur={reponse} onChange={setReponse} maximum={1000} lignes={2} placeholder="Merci, on la met à l'étude dès cette semaine !" />
        <div className="flex flex-wrap gap-2">
          <Bouton petit variante="principal" desactive={!reponse.trim() || reponse.trim() === (i.reponseBrigade ?? "")} chargement={etat.enCours} onClick={() => agir(() => repondreIdee(i.id, reponse.trim()), "Réponse publiée ✅")}>
            {i.reponseBrigade ? "Modifier la réponse" : "Répondre"}
          </Bouton>
          {i.reponseBrigade && <Bouton petit onClick={() => agir(() => repondreIdee(i.id, null), "Réponse retirée")}>Retirer la réponse</Bouton>}
          {i.reponduLe && <span className="self-center text-xs text-gris">Répondu le {formaterDate(i.reponduLe)}</span>}
        </div>
      </div>
      {ouverts && <CommentairesIdee ideeId={i.id} />}
      {etat.erreur && <p role="alert" className="text-sm font-semibold text-tomate">{etat.erreur}</p>}
    </li>
  );
}
