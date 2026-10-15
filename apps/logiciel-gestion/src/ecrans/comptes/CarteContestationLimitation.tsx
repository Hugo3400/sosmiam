import { Check, Unlock } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { reexaminerLimitation, type Limitation } from "~/services/limitations.ts";

type Props = { limitation: Limitation; onOuvrir: (compteId: number) => void; onDecide: () => void };

/** Une limitation contestée : la décision, la contestation, et le réexamen (maintenir ou lever, avec un mot pour la personne). */
export function CarteContestationLimitation({ limitation: l, onOuvrir, onDecide }: Props) {
  const [message, setMessage] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  async function reexaminer(lever: boolean) {
    setEtat({ enCours: true, erreur: null });
    try {
      await reexaminerLimitation(l.id, lever, message.trim());
      onDecide();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <li className="grid gap-3 rounded-carte border border-ligne bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-titre text-base font-extrabold">Limitation n° {l.id} · compte n° {l.compteId}</p>
        <Bouton petit variante="discret" onClick={() => onOuvrir(l.compteId)}>Ouvrir le compte</Bouton>
      </div>
      <p className="text-[13px] text-gris">
        Du {formaterDate(l.debut, true)} {l.fin ? `au ${formaterDate(l.fin, true)}` : "jusqu'à nouvel ordre"}{l.leveeLe ? ` · levée le ${formaterDate(l.leveeLe)}` : ""}
      </p>
      <p className="text-sm"><strong>Règle :</strong> {MOTIFS_MODERATION[l.motif]?.libelle ?? l.motif} · <strong>Pourquoi :</strong> {l.motivation}</p>
      <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm"><strong>Contestation du {formaterDate(l.contesteLe!, true)} :</strong> « {l.contestation} »</p>
      <ZoneTexte libelle="Ta réponse à la personne (facultative, dans le mail)" valeur={message} onChange={setMessage} maximum={1000} lignes={2} />
      <div className="flex flex-wrap gap-2">
        <Bouton icone={Check} chargement={etat.enCours} onClick={() => reexaminer(false)}>Maintenir</Bouton>
        <Bouton variante="principal" icone={Unlock} chargement={etat.enCours} onClick={() => reexaminer(true)}>Lui donner raison et lever</Bouton>
      </div>
      {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
    </li>
  );
}
