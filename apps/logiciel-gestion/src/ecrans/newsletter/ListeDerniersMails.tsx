import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { estEnRelance } from "~/fonctions/newsletter/est-en-relance.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { EnvoiRecent } from "~/services/courriels.ts";

const TYPES: Record<string, string> = {
  essai: "Essai",
  "ambassadeur-valide": "Bienvenue ambassadeur",
  "alerte-retrait": "Alerte avant retrait du rôle",
  "alerte-effacement": "Alerte avant effacement",
  "mot-de-passe": "Lien mot de passe",
  "verification-email": "Vérification d'adresse",
  "confirmation-newsletter": "Confirmation newsletter",
  ecrit: "Mail écrit par l'équipe",
  certifie: "Compte certifié",
  "compte-limite": "Compte limité",
  "limitation-levee": "Limitation levée",
  "limitation-maintenue": "Limitation maintenue",
};
type Pastille = { libelle: string; ton: "vert" | "jaune" | "rouge" | "neutre" };
const INCONNU: Pastille = { libelle: "Autre", ton: "neutre" };
const EN_RELANCE: Pastille = { libelle: "On réessaie", ton: "jaune" };
const STATUTS: Partial<Record<string, Pastille>> = {
  envoye: { libelle: "Parti", ton: "vert" },
  "en-attente": { libelle: "En attente", ton: "jaune" },
  echec: { libelle: "Refusé", ton: "rouge" },
  annule: { libelle: "Annulé", ton: "neutre" },
};

export function ListeDerniersMails({ envois }: { envois: EnvoiRecent[] }) {
  return (
    <Carte titre="Derniers mails (hors envois groupés)" sansMarge>
      {envois.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gris">Aucun pour l'instant. Ils partent tout seuls : bienvenue d'un ambassadeur validé, alertes avant retrait ou effacement, liens de mot de passe et de vérification. Un lien refusé par le serveur mail est réessayé 4 fois en 45 minutes.</p>
      ) : (
        <ul>
          {envois.map((envoi) => {
            const relance = estEnRelance(envoi);
            const pastille = relance ? EN_RELANCE : STATUTS[envoi.statut] ?? INCONNU;
            return (
              <li key={envoi.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ligne/70 px-5 py-2 text-sm last:border-0">
                <span className="w-48 font-semibold">{TYPES[envoi.type] ?? envoi.type}</span>
                <span className="min-w-0 flex-1 truncate">{envoi.destinataire}</span>
                <Badge ton={pastille.ton}>{pastille.libelle}{envoi.essais > 1 ? ` · ${envoi.essais} essais` : ""}</Badge>
                <span className="w-36 text-right text-gris">{formaterDate(envoi.envoyeLe ?? envoi.creeLe, true)}</span>
                {envoi.erreur && <span className={`w-full text-[13px] ${relance ? "text-gris" : "text-rouge-texte"}`}>{envoi.erreur}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
}
