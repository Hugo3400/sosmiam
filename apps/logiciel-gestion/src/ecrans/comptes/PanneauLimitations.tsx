import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerLimitations } from "~/services/limitations.ts";
import { CarteContestationLimitation } from "./CarteContestationLimitation.tsx";

type Props = { onOuvrir: (compteId: number) => void; onDecision: () => void };

/** Les comptes limités : d'abord les contestations à réexaminer, puis les limitations qui courent (ou vont commencer). */
export function PanneauLimitations({ onOuvrir, onDecision }: Props) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerLimitations, []);
  const decide = () => (recharger(), onDecision());
  if (!donnees) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;
  return (
    <div className="grid gap-5">
      {donnees.contestations.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-titre text-lg font-extrabold">Contestations à réexaminer ({donnees.contestations.length})</h2>
          <ul className="grid gap-3">
            {donnees.contestations.map((l) => <CarteContestationLimitation key={l.id} limitation={l} onOuvrir={onOuvrir} onDecide={decide} />)}
          </ul>
        </section>
      )}
      <Carte titre={`Comptes limités (${donnees.enCours.length})`} sansMarge>
        {donnees.enCours.length === 0 ? (
          <EtatVide emoji="🕊️" titre="Aucun compte limité">On limite un compte depuis sa fiche : « Limiter ce compte ».</EtatVide>
        ) : (
          <ul>
            {donnees.enCours.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => onOuvrir(l.compteId)} className="grid w-full gap-0.5 border-b border-ligne/70 px-5 py-2.5 text-left text-sm last:border-0 hover:bg-creme">
                  <span className="font-semibold">{l.compte.prenom}{l.compte.pseudo ? ` (@${l.compte.pseudo})` : ""} · compte n° {l.compteId}</span>
                  <span className="text-[13px] text-gris">
                    {MOTIFS_MODERATION[l.motif]?.libelle ?? l.motif} · {Date.parse(l.debut) > Date.now() ? `à partir du ${formaterDate(l.debut, true)}` : `depuis le ${formaterDate(l.debut)}`}
                    {l.fin ? `, jusqu'au ${formaterDate(l.fin, true)}` : ", jusqu'à nouvel ordre"}
                    {l.contesteLe && !l.reexamineLe ? " · contestée" : l.reexamineLe ? " · réexaminée" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
