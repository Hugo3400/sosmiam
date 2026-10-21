import { Globe, Info, Power, PowerOff, RotateCw, ShieldCheck, Smartphone, TriangleAlert, type LucideIcon } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { LIBELLES_ACTIONS, TEXTES_SERVEURS } from "~/contenus/serveurs-dev.ts";
import { decrireEtatServeur } from "~/fonctions/maintenance/decrire-etat-serveur.ts";
import { listerActionsServeur } from "~/fonctions/maintenance/lister-actions-serveur.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import type { ActionServeur, ServeurSuivi } from "~/services/serveurs.ts";

type Props = {
  serveur: ServeurSuivi;
  actionEnCours: ActionServeur | null;
  occupe: boolean;
  onAction: (action: ActionServeur) => void;
};

const ICONES_ACTIONS: Record<ActionServeur, LucideIcon> = { allumer: Power, eteindre: PowerOff, redemarrer: RotateCw };
const VARIANTES_ACTIONS = { allumer: "principal", eteindre: "danger", redemarrer: "secondaire" } as const;

function decrireDetails(serveur: ServeurSuivi): string {
  if (serveur.etat === "en-ligne") {
    const morceaux = [
      serveur.depuis ? `Allumé ${formaterDateRelative(serveur.depuis)}` : "Allumé",
      serveur.memoire !== null ? `${formaterOctets(serveur.memoire)} de mémoire` : null,
      serveur.redemarrages !== null ? `${formaterNombre(serveur.redemarrages)} redémarrage${serveur.redemarrages > 1 ? "s" : ""}` : null,
    ];
    return morceaux.filter(Boolean).join(" · ");
  }
  if (serveur.etat === "arrete") return "Éteint : il ne consomme rien et n'écoute personne.";
  if (serveur.etat === "en-transition") return `pm2 dit « ${serveur.statutPm2 ?? "?"} » : ça se stabilise dans quelques secondes.`;
  if (serveur.etat === "en-erreur") return "Il a planté au démarrage. Regarde ses journaux (pm2 logs) avant de le rallumer.";
  if (serveur.etat === "absent") return `pm2 ne connaît plus « ${serveur.processus} ».`;
  return "pm2 ne répond pas : impossible de savoir.";
}

export function CarteServeurDev({ serveur, actionEnCours, occupe, onAction }: Props) {
  const etat = decrireEtatServeur(serveur.etat, serveur.pilotable);
  const textes = TEXTES_SERVEURS[serveur.id];
  const Icone = serveur.id === "app-dev" ? Smartphone : Globe;
  const allume = serveur.etat === "en-ligne";
  return (
    <section
      aria-label={serveur.nom}
      className={`grid content-start gap-3 rounded-carte bg-white p-5 ${allume && serveur.id === "app-dev" ? "border-2 border-encre" : "border border-ligne"}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="flex items-center gap-2 text-base font-extrabold"><Icone className="size-5" aria-hidden /> {serveur.nom}</h2>
          <p className="font-mono text-xs text-gris">{serveur.processus}</p>
        </div>
        <Badge ton={etat.ton}>
          <span className={`size-2 rounded-full ${allume ? "bg-vert" : serveur.etat === "arrete" ? "bg-gris" : "bg-tomate"}`} aria-hidden />
          {etat.libelle}
        </Badge>
      </header>
      {textes && <p className="text-sm">{textes.role}</p>}
      <p className="chiffres text-[13px] text-gris">{decrireDetails(serveur)}</p>
      {textes && textes.notes.length > 0 && (
        <ul className="grid gap-2">
          {textes.notes.map((note) => {
            const alerte = note.ton === "alerte" && (allume || !note.texteEteint);
            return (
              <li key={note.texte} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[13px] ${alerte ? "bg-jaune-clair font-semibold" : note.ton === "alerte" ? "bg-vert-clair text-vert" : "text-gris"}`}>
                {alerte ? <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> : note.ton === "alerte" ? <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden />}
                <span>{note.ton === "alerte" && !allume && note.texteEteint ? note.texteEteint : note.texte}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {listerActionsServeur(serveur).map((action) => (
          <Bouton
            key={action}
            petit
            variante={VARIANTES_ACTIONS[action]}
            icone={ICONES_ACTIONS[action]}
            chargement={actionEnCours === action}
            desactive={occupe && actionEnCours !== action}
            onClick={() => onAction(action)}
          >
            {LIBELLES_ACTIONS[action].bouton}
          </Bouton>
        ))}
        {actionEnCours && <span role="status" className="text-[13px] font-semibold text-gris">Il {LIBELLES_ACTIONS[actionEnCours].enCours}…</span>}
      </div>
    </section>
  );
}
