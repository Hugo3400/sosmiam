import { DatabaseBackup, Download, KeyRound } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireSauvegardes, sauvegarderMaintenant, telechargerSauvegarde } from "~/services/sauvegardes.ts";
import { enregistrerFichierBinaire } from "~/services/systeme.ts";

/** Sauvegardes chiffrées de la base : la dernière, une à la demande, et une copie à garder sur ce PC. */
export function CarteSauvegardes({ apresSauvegarde }: { apresSauvegarde: () => void }) {
  const { donnees, erreur, recharger } = utiliserChargement(lireSauvegardes, []);
  const [etat, setEtat] = useState<{ enCours: string | null; message: string | null; erreur: string | null }>({ enCours: null, message: null, erreur: null });
  const derniere = donnees?.sauvegardes[0];

  async function agir(nom: string, action: () => Promise<string | null>) {
    setEtat({ enCours: nom, message: null, erreur: null });
    try {
      setEtat({ enCours: null, message: await action(), erreur: null });
    } catch (probleme) {
      setEtat({ enCours: null, message: null, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) || "Ça n'a pas marché." });
    }
  }

  return (
    <Carte
      titre={<span className="flex items-center gap-2"><DatabaseBackup className="size-4" aria-hidden /> Sauvegardes de la base</span>}
      actions={
        <Bouton
          petit
          variante="principal"
          chargement={etat.enCours === "sauvegarder"}
          onClick={() => agir("sauvegarder", async () => {
            const sauvegarde = await sauvegarderMaintenant();
            recharger();
            apresSauvegarde();
            return `Sauvegarde faite : ${formaterOctets(sauvegarde.taille)} ✅`;
          })}
        >
          Sauvegarder maintenant
        </Bouton>
      }
    >
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {donnees && (
        <div className="grid gap-4 text-sm">
          <p>
            {derniere
              ? <>Dernière : <strong>{formaterDateRelative(derniere.creeLe)}</strong> ({formaterDate(derniere.creeLe, true)}, {formaterOctets(derniere.taille)}). </>
              : <strong>Aucune sauvegarde pour l'instant. </strong>}
            Une sauvegarde chiffrée part chaque nuit vers 3 h 30 ; les 30 dernières sont gardées sur le serveur.
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-creme px-3 py-2">
            <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {donnees.cleExiste
                ? <>Note la <strong>clé de restauration</strong> dans ton gestionnaire de mots de passe : sans elle, aucune sauvegarde ne se relit. Dans un terminal du serveur, toi-même : <code className="text-[12px]">npm run sauvegardes:cle</code>.</>
                : <>La clé de restauration sera créée à la première sauvegarde. Tu la noteras ensuite avec <code className="text-[12px]">npm run sauvegardes:cle</code>.</>}
            </span>
          </p>
          {donnees.sauvegardes.length > 0 && (
            <ul className="grid gap-1">
              {donnees.sauvegardes.slice(0, 5).map((sauvegarde) => (
                <li key={sauvegarde.nom} className="flex items-center gap-3">
                  <span className="chiffres flex-1">{formaterDate(sauvegarde.creeLe, true)}</span>
                  <span className="chiffres text-gris">{formaterOctets(sauvegarde.taille)}</span>
                  <Bouton
                    petit
                    variante="discret"
                    icone={Download}
                    titre="Garder une copie sur ce PC"
                    chargement={etat.enCours === sauvegarde.nom}
                    onClick={() => agir(sauvegarde.nom, async () => {
                      const fichier = await telechargerSauvegarde(sauvegarde.nom);
                      return (await enregistrerFichierBinaire(sauvegarde.nom, fichier)) ? "Copie enregistrée sur ce PC (chiffrée) ✅" : null;
                    })}
                  />
                </li>
              ))}
            </ul>
          )}
          {(etat.message || etat.erreur) && <p role="status" className={`font-semibold ${etat.erreur ? "text-rouge-texte" : "text-vert"}`}>{etat.erreur ?? etat.message}</p>}
          <p className="text-[13px] text-gris">
            Garder de temps en temps une copie sur ce PC protège aussi contre la perte du serveur. Pour en relire une :
            <code className="mx-1">npm run sauvegardes:dechiffrer -- &lt;fichier&gt;</code>, puis pg_restore.
          </p>
        </div>
      )}
    </Carte>
  );
}
