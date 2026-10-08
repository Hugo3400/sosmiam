import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { EnvoiRecent } from "~/services/courriels.ts";

const TYPES: Record<string, string> = {
  essai: "Essai",
  "ambassadeur-valide": "Bienvenue ambassadeur",
  "alerte-retrait": "Alerte avant retrait du rôle",
  "alerte-effacement": "Alerte avant effacement",
  "mot-de-passe": "Lien mot de passe",
};
const STATUTS: Record<EnvoiRecent["statut"], { libelle: string; ton: "vert" | "jaune" | "rouge" | "neutre" }> = {
  envoye: { libelle: "Parti", ton: "vert" },
  "en-attente": { libelle: "En attente", ton: "jaune" },
  echec: { libelle: "Refusé", ton: "rouge" },
  annule: { libelle: "Annulé", ton: "neutre" },
};

/** Les derniers mails seuls (essais, bienvenue, alertes, mots de passe) : le journal est effacé après 90 jours. */
export function ListeDerniersMails({ envois }: { envois: EnvoiRecent[] }) {
  return (
    <Carte titre="Derniers mails (hors envois groupés)" sansMarge>
      {envois.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gris">Aucun pour l'instant. Ils partent tout seuls : bienvenue d'un ambassadeur validé, alertes avant retrait ou effacement, liens de mot de passe.</p>
      ) : (
        <ul>
          {envois.map((envoi) => (
            <li key={envoi.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ligne/70 px-5 py-2 text-sm last:border-0">
              <span className="w-48 font-semibold">{TYPES[envoi.type] ?? envoi.type}</span>
              <span className="min-w-0 flex-1 truncate">{envoi.destinataire}</span>
              <Badge ton={STATUTS[envoi.statut].ton}>{STATUTS[envoi.statut].libelle}</Badge>
              <span className="w-36 text-right text-gris">{formaterDate(envoi.envoyeLe ?? envoi.creeLe, true)}</span>
              {envoi.erreur && <span className="w-full text-[13px] text-rouge-texte">{envoi.erreur}</span>}
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
