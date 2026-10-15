import { EyeOff, RotateCcw } from "lucide-react";
import { useState } from "react";

import { TARIFS_EVENEMENT_ECRITS, TYPES_EVENEMENT_ECRITS } from "../../../../../packages/commun/src/contenus/types-evenement.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { suspendreEvenement, type EvenementGestion } from "~/services/evenements.ts";

/** Un événement d'un lieu : quoi, quand, où, combien de personnes intéressées, et le suspendre (motif gardé au journal). */
export function CarteEvenement({ evenement: e, onChange }: { evenement: EvenementGestion; onChange: () => void }) {
  const [fenetre, setFenetre] = useState(false);
  const [motif, setMotif] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const type = TYPES_EVENEMENT_ECRITS[e.type as keyof typeof TYPES_EVENEMENT_ECRITS] ?? { emoji: "✨", nom: e.type };
  const tarif = TARIFS_EVENEMENT_ECRITS[e.tarif as keyof typeof TARIFS_EVENEMENT_ECRITS] ?? e.tarif;

  async function agir(suspendu: boolean) {
    setEtat({ enCours: true, erreur: null });
    try {
      await suspendreEvenement(e.id, suspendu, motif.trim());
      setFenetre(false);
      onChange();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <li className={`grid gap-2 rounded-carte border bg-white p-4 ${e.suspendu ? "border-dashed border-tomate" : "border-ligne"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">{type.emoji} {e.titre}</p>
        {e.suspendu && <Badge ton="rouge">Suspendu</Badge>}
        {e.annuleLe && <Badge>Annulé par le lieu</Badge>}
        {e.alcool && <Badge ton="contour">🍷 Alcool</Badge>}
      </div>
      <p className="text-[13px] text-gris">
        {e.lieu.emoji} {e.lieu.nom} · {e.lieu.ville} · {type.nom} · {formaterDate(e.debut, true)}{e.fin ? ` → ${formaterDate(e.fin, true)}` : ""}
        {e.hebdoJusqua ? ` · chaque semaine jusqu'au ${formaterDate(e.hebdoJusqua)}` : ""}
      </p>
      <p className="text-sm whitespace-pre-line">{e.description}</p>
      <p className="text-[13px] text-gris">
        {tarif}{e.prixCentimes !== null ? ` · ${(e.prixCentimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}` : ""}
        {e.places !== null ? ` · ${e.places} places` : ""} · {e._count.interets} intéressé{e._count.interets > 1 ? "s" : ""} · publié {e.compteId ? `par le compte n° ${e.compteId}` : "par l'équipe"}
      </p>
      <div className="flex gap-2">
        {e.suspendu
          ? <Bouton petit icone={RotateCcw} chargement={etat.enCours} onClick={() => agir(false)}>Rétablir</Bouton>
          : <Bouton petit variante="danger" icone={EyeOff} onClick={() => (setMotif(""), setEtat({ enCours: false, erreur: null }), setFenetre(true))}>Suspendre</Bouton>}
      </div>
      {etat.erreur && !fenetre && <p role="alert" className="text-sm font-semibold text-tomate">{etat.erreur}</p>}
      <Modale
        titre="Suspendre cet événement ?"
        ouverte={fenetre}
        onFermer={() => setFenetre(false)}
        actions={<><Bouton onClick={() => setFenetre(false)}>Annuler</Bouton><Bouton variante="danger" chargement={etat.enCours} desactive={motif.trim().length < 5} onClick={() => agir(true)}>Suspendre</Bouton></>}
      >
        <p className="mb-3 text-sm">Il disparaît de l'app tout de suite (rien n'est effacé, tu peux le rétablir). Écris pourquoi : c'est gardé au journal.</p>
        <ZoneTexte libelle="Motif" valeur={motif} maximum={300} lignes={3} onChange={setMotif} placeholder="Faux événement, hors sujet, alcool mis en avant…" />
        {etat.erreur && <p role="alert" className="mt-2 text-sm font-semibold text-tomate">{etat.erreur}</p>}
      </Modale>
    </li>
  );
}
