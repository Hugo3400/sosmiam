import type { ReactNode } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ID_MACHINE_PRINCIPALE, lireSystemeMachine } from "~/services/machines.ts";

function Ligne({ titre, aide, children }: { titre: string; aide: string; children: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-ligne/70 px-5 py-2.5 text-sm last:border-0">
      <span className="grid min-w-0 gap-px"><b className="font-semibold">{titre}</b><span className="text-[12.5px] text-gris">{aide}</span></span>
      <span className="shrink-0 text-right text-[13px] text-gris">{children}</span>
    </li>
  );
}

const formaterCoeurs = (coeurs: number) => `${coeurs.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} cœur${coeurs >= 2 ? "s" : ""}`;

export function OngletSysteme({ tour }: { tour: number }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireSystemeMachine(ID_MACHINE_PRINCIPALE), [tour]);
  if (!donnees && chargement) return <Chargement />;
  if (!donnees) return <MessageErreur erreur={erreur} reessayer={recharger} />;
  const { services, sante, gourmands } = donnees;
  const plusGros = Math.max(0.01, ...(gourmands ?? []).map((gourmand) => gourmand.coeurs));
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Carte titre="Services du système" sansMarge actions={<span className="text-[13px] text-gris">en lecture seule</span>}>
          {services === null ? (
            <p className="p-5 text-sm text-gris">systemctl ne répond pas : impossible de lire les services.</p>
          ) : (
            <ul>
              {services.map((service) => (
                <Ligne key={service.unite} titre={service.nom} aide={service.role}>
                  {service.actif ? <Badge ton="vert">En marche</Badge> : <Badge ton="rouge">{service.etat === "inactive" ? "Arrêté" : `Arrêté (${service.etat})`}</Badge>}
                </Ligne>
              ))}
            </ul>
          )}
        </Carte>
        <Carte titre="Santé du système" sansMarge>
          <ul>
            <Ligne titre="Mises à jour en attente" aide={`${sante.systeme ?? "Debian"}, vérifiées toutes les heures`}>
              {sante.misesAJour === null ? "Illisible" : sante.misesAJour === 0 ? <Badge ton="vert">Aucune</Badge> : <Badge ton="jaune">{sante.misesAJour}</Badge>}
            </Ligne>
            <Ligne titre="Redémarrage demandé" aide="Après une mise à jour du noyau">
              {sante.redemarrageDemande ? <Badge ton="jaune">Oui</Badge> : <Badge ton="vert">Non</Badge>}
            </Ligne>
            <Ligne titre="Noyau" aide="Celui qui tourne en ce moment"><span className="font-mono text-xs">{sante.noyau}</span></Ligne>
            <Ligne titre={`Certificat ${sante.certificat.domaine}`} aide="Certificat d'origine Cloudflare">
              {sante.certificat.valableJusquau ? `valable jusqu'au ${formaterDate(sante.certificat.valableJusquau)}` : "Illisible"}
            </Ligne>
            <Ligne titre="Processeur" aide="La puce de la machine">{sante.processeur.modele ?? "Inconnu"} · {sante.processeur.coeurs} cœurs</Ligne>
          </ul>
        </Carte>
      </div>
      <Carte titre="Qui fait chauffer le processeur" sansMarge actions={<span className="text-[13px] text-gris">les 5 plus gourmands, maintenant</span>}>
        {gourmands === null ? (
          <p className="p-5 text-sm text-gris">top ne répond pas : impossible de savoir.</p>
        ) : gourmands.length === 0 ? (
          <p className="p-5 text-sm text-gris">Personne : le processeur se repose. 😴</p>
        ) : (
          <ul>
            {gourmands.map((gourmand) => (
              <Ligne key={gourmand.nom} titre={gourmand.nom} aide={gourmand.role ?? "Un programme du serveur"}>
                <span className="chiffres inline-flex items-center gap-2">
                  <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-ligne" aria-hidden>
                    <span className="block h-full rounded-full bg-graphique" style={{ width: `${Math.max(3, Math.round((gourmand.coeurs / plusGros) * 100))}%` }} />
                  </span>
                  {formaterCoeurs(gourmand.coeurs)}
                </span>
              </Ligne>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
