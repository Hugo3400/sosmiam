import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { BADGES, PALIERS } from "~/contenus/ambassadeurs.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireClassement } from "~/services/ambassadeurs.ts";

const MEDAILLES = ["🥇", "🥈", "🥉"];
const moisEnCours = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "Europe/Paris" }).format(new Date());

type Ligne = { id: number; prenom: string; ville: string; points: number; extra?: string };

function Classement({ lignes, onOuvrirCompte, vide }: { lignes: Ligne[]; onOuvrirCompte: (id: number) => void; vide: string }) {
  if (lignes.length === 0) return <p className="text-sm text-gris">{vide}</p>;
  return (
    <ol className="grid gap-1 text-sm">
      {lignes.map((ligne, rang) => (
        <li key={ligne.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-creme/60">
          <span className="chiffres w-7 text-center font-bold">{MEDAILLES[rang] ?? rang + 1}</span>
          <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold hover:underline" onClick={() => onOuvrirCompte(ligne.id)}>
            {ligne.prenom} <span className="font-normal text-gris">· {ligne.ville}{ligne.extra ? ` · ${ligne.extra}` : ""}</span>
          </button>
          <span className="chiffres font-bold">{formaterNombre(ligne.points)} pts</span>
        </li>
      ))}
    </ol>
  );
}

/** Classement des ambassadeurs actifs : le mois en cours (de quoi féliciter) et depuis le début. */
export function CarteClassement({ onOuvrirCompte, tour }: { onOuvrirCompte: (id: number) => void; tour: number }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireClassement, [tour]);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="xl:col-span-2"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <>
          <Carte titre={`En ${moisEnCours}`}>
            <Classement
              lignes={donnees.mois}
              onOuvrirCompte={onOuvrirCompte}
              vide="Personne n'a encore gagné de points ce mois-ci."
            />
          </Carte>
          <Carte titre="Depuis le début">
            <Classement
              lignes={donnees.toujours.map((a) => ({
                id: a.id,
                prenom: a.prenom,
                ville: a.ambassadeur?.ville ?? "",
                points: a.points,
                extra: [PALIERS[a.palier]?.emoji, ...a.badges.map((b) => (BADGES[b.badge] ?? "").split(" ")[0])].filter(Boolean).join(" "),
              }))}
              onOuvrirCompte={onOuvrirCompte}
              vide="Pas encore d'ambassadeur actif."
            />
          </Carte>
        </>
      )}
    </div>
  );
}
