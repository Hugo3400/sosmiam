import { Check, LifeBuoy, RotateCcw, Save, Trash2, Vote, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { ETAPES_BIG_SOS, ORIGINES_BIG_SOS, PHASES_BIG_SOS } from "~/contenus/big-sos.ts";
import { isoVersSaisie } from "~/fonctions/dates/iso-vers-saisie.ts";
import { saisieVersIso } from "~/fonctions/dates/saisie-vers-iso.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { deciderBigSos, lireBigSos, modifierBigSos, supprimerBigSos, type DecisionBigSos } from "~/services/big-sos.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ObjectifEtLiensBigSos } from "./ObjectifEtLiensBigSos.tsx";
import { VerificationBigSos } from "./VerificationBigSos.tsx";

const SEPT_JOURS = 7 * 86_400_000;
/** Demain 8 h (heure de ce PC) : la date proposée pour passer à la une */
const demainMatin = () => {
  const date = new Date(Date.now() + 86_400_000);
  date.setHours(8, 0, 0, 0);
  return isoVersSaisie(date.toISOString());
};

/** Tout un BIG SOS : son parcours, l'histoire du lieu, la vérification, les décisions, l'objectif et le bilan. */
export function FicheBigSos({ id, onFermer, onChange }: { id: number; onFermer: () => void; onChange: () => void }) {
  const { donnees: bigSos, erreur, chargement, recharger } = utiliserChargement(() => lireBigSos(id), [id]);
  const [histoire, setHistoire] = useState<string | null>(null);
  const [debut, setDebut] = useState(demainMatin);
  const [bilan, setBilan] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const actualiser = () => {
    recharger();
    onChange();
  };

  async function agir(action: () => Promise<unknown>, reussite: string) {
    setEtat({ enCours: true, texte: null });
    try {
      await action();
      setEtat({ enCours: false, texte: reussite });
      actualiser();
    } catch (probleme) {
      const erreurApi = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, texte: erreurApi?.code === "etape-impossible" ? "Pas possible à cette étape (quelqu'un l'a peut-être déjà fait avancer)." : expliquerErreur(erreurApi) });
    }
  }
  const decider = (decision: DecisionBigSos, reussite: string) => agir(() => deciderBigSos(id, decision), reussite);

  if (!bigSos) {
    return (
      <Modale large titre="BIG SOS" ouverte onFermer={onFermer}>
        <MessageErreur erreur={erreur} reessayer={recharger} />
        {chargement && <Chargement />}
      </Modale>
    );
  }
  const { phase } = bigSos;
  const etapeActuelle = ETAPES_BIG_SOS.findIndex((etape) => etape.phases.includes(phase));
  const debutIso = saisieVersIso(debut);
  const avantValidation = ["demande", "verification", "vote", "programme"].includes(phase);

  return (
    <Modale large titre={`${bigSos.lieu.emoji} ${bigSos.lieu.nom} · BIG SOS n° ${bigSos.id}`} ouverte onFermer={onFermer}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge ton={PHASES_BIG_SOS[phase].ton}>{PHASES_BIG_SOS[phase].libelle}</Badge>
            <span className="text-sm text-gris">{ORIGINES_BIG_SOS[bigSos.origine]}{bigSos.compte ? ` (${bigSos.compte.prenom})` : ""} · {bigSos.lieu.ville} · ouvert le {formaterDate(bigSos.creeLe)}</span>
          </div>
          {phase !== "refuse" && (
            <ol className="flex flex-wrap gap-1 text-xs font-semibold" aria-label="Étapes">
              {ETAPES_BIG_SOS.map((etape, i) => (
                <li key={etape.libelle} className={`rounded-full px-2.5 py-1 ${i < etapeActuelle ? "bg-vert-clair text-vert" : i === etapeActuelle ? "bg-nuit text-jaune" : "bg-ligne/70 text-gris"}`}>
                  {i + 1}. {etape.libelle}
                </li>
              ))}
            </ol>
          )}
          {bigSos.debutLe && bigSos.finLe && <p className="text-sm">À la une du <strong>{formaterDate(bigSos.debutLe, true)}</strong> au <strong>{formaterDate(bigSos.finLe, true)}</strong>.</p>}
          <p className="rounded-xl bg-creme px-3 py-2 text-[13px]">
            Limites pas encore décidées : à toi de juger.{" "}
            {bigSos.memeLieu.length > 0 ? `Ce lieu a déjà eu ${bigSos.memeLieu.length} autre(s) BIG SOS (le dernier ouvert le ${formaterDate(bigSos.memeLieu[0]!.creeLe)}).` : "Premier BIG SOS de ce lieu."}{" "}
            {bigSos.debutLe ? `${bigSos.enMemeTemps} autre(s) à la une sur les mêmes dates.` : ""}
          </p>
        </div>

        <section className="grid gap-2">
          <h3 className="font-extrabold">Son histoire</h3>
          <ZoneTexte libelle="Affichée sur la page du BIG SOS" valeur={histoire ?? bigSos.histoire} onChange={setHistoire} maximum={3000} lignes={5} />
          {histoire !== null && histoire !== bigSos.histoire && (
            <Bouton petit icone={Save} className="justify-self-start" onClick={() => agir(() => modifierBigSos(id, { histoire: histoire.trim() }).then(() => setHistoire(null)), "Histoire enregistrée ✅")}>
              Enregistrer l'histoire
            </Bouton>
          )}
        </section>

        {["demande", "verification", "vote"].includes(phase) && <VerificationBigSos bigSos={bigSos} onChange={actualiser} />}

        {avantValidation && (
          <section className="grid gap-3">
            <h3 className="font-extrabold">Décision</h3>
            <div className="flex flex-wrap items-end gap-3">
              <Champ libelle={phase === "programme" ? "Changer le début" : "À la une à partir du"} type="datetime-local" valeur={debut} onChange={setDebut} className="w-56" />
              <p className="pb-2 text-sm text-gris">{debutIso ? `jusqu'au ${formaterDate(new Date(new Date(debutIso).getTime() + SEPT_JOURS), true)} (7 jours)` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Bouton variante="principal" icone={phase === "programme" ? Check : LifeBuoy} desactive={!debutIso} onClick={() => debutIso && decider({ decision: "valider", debutLe: debutIso }, "Validé : il passera à la une à la date choisie ✅")}>
                {phase === "programme" ? "Changer la date" : "Valider le BIG SOS"}
              </Bouton>
              {(phase === "demande" || phase === "verification") && (
                <Bouton icone={Vote} onClick={() => decider({ decision: "vote" }, "Soumis au vote de la communauté.")}>Soumettre au vote</Bouton>
              )}
              <Bouton variante="danger" icone={X} onClick={() => window.confirm("Refuser ce BIG SOS ? Pense à prévenir le lieu avec bienveillance.") && decider({ decision: "refuser" }, "BIG SOS refusé.")}>
                {phase === "programme" ? "Annuler" : "Refuser"}
              </Bouton>
            </div>
            {phase !== "programme" && <p className="text-[13px] text-gris">Le vote de la communauté arrivera avec l'app : en attendant, tu peux valider sans lui.</p>}
          </section>
        )}

        {["programme", "a-la-une", "a-cloturer", "termine"].includes(phase) && <ObjectifEtLiensBigSos bigSos={bigSos} onChange={actualiser} />}

        {(phase === "a-la-une" || phase === "a-cloturer") && (
          <section className="grid gap-2">
            <h3 className="font-extrabold">Bilan</h3>
            <ZoneTexte libelle="Ce que le BIG SOS a changé pour le lieu (affiché à la fin)" valeur={bilan} onChange={setBilan} maximum={3000} lignes={4} />
            <Bouton variante="principal" icone={Check} className="justify-self-start" desactive={bilan.trim().length < 10}
              onClick={() => window.confirm(phase === "a-la-une" ? "Clôturer maintenant ? Il quitte la une tout de suite." : "Clôturer avec ce bilan ?") && decider({ decision: "terminer", bilan: bilan.trim() }, "BIG SOS clôturé ✅")}>
              Clôturer avec ce bilan
            </Bouton>
          </section>
        )}
        {phase === "termine" && bigSos.bilan && (
          <section className="grid gap-2"><h3 className="font-extrabold">Bilan</h3><p className="text-sm whitespace-pre-line">{bigSos.bilan}</p></section>
        )}

        <section className="flex flex-wrap items-center gap-2 border-t border-ligne pt-4">
          {phase === "refuse" && <Bouton icone={RotateCcw} onClick={() => decider({ decision: "rouvrir" }, "Rouvert : il repart « à étudier ».")}>Rouvrir</Bouton>}
          <Bouton variante="danger" icone={Trash2} onClick={() => window.confirm("Supprimer ce BIG SOS pour de bon ?") && agir(async () => { await supprimerBigSos(id); onFermer(); }, "Supprimé.")}>Supprimer</Bouton>
          {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
        </section>
      </div>
    </Modale>
  );
}
