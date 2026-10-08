import { Activity, Database, Globe, HardDrive, RotateCw } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireEtatServeur, relancerProcessus } from "~/services/maintenance.ts";
import { JournalGestion } from "./JournalGestion.tsx";

function Etat({ icone, titre, bon, children }: { icone: ReactNode; titre: string; bon: boolean; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1 rounded-carte border border-ligne bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-gris">{icone} {titre}</p>
      <p className="flex items-center gap-2 font-titre text-xl font-extrabold">
        <span className={`size-2.5 rounded-full ${bon ? "bg-vert" : "bg-tomate"}`} aria-hidden />
        {bon ? "En forme" : "Problème"}
      </p>
      <div className="text-[13px] text-gris">{children}</div>
    </div>
  );
}

/** État du serveur (API, base, site, disque, programmes pm2), relance du site ou du bot, et journal de gestion. */
export function EcranMaintenance() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireEtatServeur, []);
  const [relance, setRelance] = useState<{ nom: string | null; message: string | null }>({ nom: null, message: null });

  async function relancer(nom: string) {
    if (!window.confirm(`Relancer ${nom} ? Il sera indisponible quelques secondes.`)) return;
    setRelance({ nom, message: null });
    try {
      await relancerProcessus(nom);
      setRelance({ nom: null, message: `${nom} relancé ✅` });
      setTimeout(recharger, 2000);
    } catch (probleme) {
      setRelance({ nom: null, message: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  const disquePlein = donnees?.disque ? 1 - donnees.disque.libre / donnees.disque.total : 0;
  return (
    <>
      <EnTeteEcran
        titre="Maintenance"
        sousTitre="L'état du serveur de SOS Miam, et tout ce qui a été fait depuis ce logiciel."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Etat icone={<Activity className="size-4" aria-hidden />} titre="API" bon>
              Lancée {formaterDateRelative(donnees.api.depuis)} · {formaterOctets(donnees.api.memoire)} · Node {donnees.api.node}
            </Etat>
            <Etat icone={<Database className="size-4" aria-hidden />} titre="Base de données" bon={donnees.base.enLigne}>
              {donnees.base.enLigne ? `Répond en ${donnees.base.delai} ms · ${formaterOctets(donnees.base.octets)}` : "Ne répond pas"}
            </Etat>
            <Etat icone={<Globe className="size-4" aria-hidden />} titre="Site" bon={donnees.site.enLigne}>
              {donnees.site.enLigne ? `Répond en ${donnees.site.delai} ms` : `Ne répond pas${donnees.site.statut ? ` (erreur ${donnees.site.statut})` : ""}`}
            </Etat>
            <Etat icone={<HardDrive className="size-4" aria-hidden />} titre="Disque" bon={disquePlein < 0.95}>
              {donnees.disque ? `${formaterOctets(donnees.disque.libre)} libres sur ${formaterOctets(donnees.disque.total)} (${Math.round(disquePlein * 100)} % plein)` : "Illisible"}
            </Etat>
          </div>

          <Carte titre="Programmes (pm2)" sansMarge>
            {relance.message && <p role="status" className="border-b border-ligne px-5 py-2 text-sm font-semibold">{relance.message}</p>}
            {donnees.processus === null ? (
              <p className="p-5 text-sm text-gris">pm2 ne répond pas.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs tracking-wide text-gris uppercase">
                  <tr className="border-b border-ligne">
                    <th scope="col" className="px-5 py-2">Programme</th><th scope="col" className="px-3 py-2">État</th><th scope="col" className="px-3 py-2">Depuis</th>
                    <th scope="col" className="px-3 py-2">Relances</th><th scope="col" className="px-3 py-2">Mémoire</th><th scope="col" className="px-5 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.processus.map((p) => (
                    <tr key={p.nom} className="border-b border-ligne/70 last:border-0">
                      <td className="px-5 py-2.5 font-semibold">{p.nom}</td>
                      <td className="px-3 py-2.5"><Badge ton={p.statut === "online" ? "vert" : "rouge"}>{p.statut === "online" ? "En ligne" : p.statut}</Badge></td>
                      <td className="px-3 py-2.5">{p.depuis ? formaterDateRelative(p.depuis) : "—"}</td>
                      <td className="chiffres px-3 py-2.5">{formaterNombre(p.relances)}</td>
                      <td className="chiffres px-3 py-2.5">{formaterOctets(p.memoire)}</td>
                      <td className="px-5 py-2.5 text-right">
                        {p.relancable && <Bouton petit icone={RotateCw} chargement={relance.nom === p.nom} onClick={() => relancer(p.nom)}>Relancer</Bouton>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Carte>

          <Carte titre="Base de données">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm md:grid-cols-3">
              {donnees.base.tables.map((t) => (
                <li key={t.table} className="flex justify-between gap-3"><span className="font-mono text-[13px]">{t.table}</span><span className="chiffres text-gris">{formaterNombre(t.lignes)}</span></li>
              ))}
            </ul>
          </Carte>
        </div>
      )}
      <div className="mt-5"><JournalGestion /></div>
    </>
  );
}
