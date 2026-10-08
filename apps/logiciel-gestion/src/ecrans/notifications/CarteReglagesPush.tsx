import { Smartphone } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import type { EtatPush, EtatReglagePush } from "~/services/notifications.ts";

const ETATS: Record<EtatReglagePush, { libelle: string; ton: "vert" | "jaune" | "rouge" }> = {
  pret: { libelle: "Réglé", ton: "vert" },
  absent: { libelle: "Pas encore réglé", ton: "jaune" },
  "mal-protege": { libelle: "Fichier mal protégé (chmod 600)", ton: "rouge" },
  incomplet: { libelle: "Fichier incomplet", ton: "rouge" },
};

/** Où en est l'envoi direct vers Apple et Google, combien de téléphones sont inscrits, et comment régler ce qui manque. */
export function CarteReglagesPush({ etat }: { etat: EtatPush }) {
  const pret = etat.apple === "pret" && etat.google === "pret";
  return (
    <Carte titre={<span className="flex items-center gap-2"><Smartphone className="size-4" aria-hidden /> Envoi direct à Apple et Google</span>}>
      <div className="grid gap-3 text-sm">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
          <dt className="text-gris">iPhone (Apple)</dt><dd><Badge ton={ETATS[etat.apple].ton}>{ETATS[etat.apple].libelle}</Badge> <span className="chiffres ml-2">{etat.iphone} téléphone(s)</span></dd>
          <dt className="text-gris">Android (Google)</dt><dd><Badge ton={ETATS[etat.google].ton}>{ETATS[etat.google].libelle}</Badge> <span className="chiffres ml-2">{etat.android} téléphone(s)</span></dd>
        </dl>
        {!pret && (
          <div className="grid gap-2 rounded-xl bg-creme p-3">
            <p className="font-semibold">À régler toi-même sur le serveur (fichiers lisibles par root seul, jamais à travers Claude) :</p>
            <ul className="grid list-disc gap-1 pl-5">
              {etat.apple !== "pret" && (
                <li>
                  <strong>Apple</strong> : sur developer.apple.com, Certificates, Identifiers &amp; Profiles → Keys, crée une clé avec « Apple Push Notifications service » coché.
                  Dépose le fichier <code>.p8</code> dans <code>/root/sos-miam-secrets/</code>, puis crée <code>push-apple.env</code> avec <code>APNS_CLE_FICHIER=</code> (chemin du .p8),
                  <code> APNS_CLE_ID=</code> (Key ID) et <code>APNS_EQUIPE_ID=</code> (Team ID).
                </li>
              )}
              {etat.google !== "pret" && (
                <li>
                  <strong>Google</strong> : crée un projet Firebase gratuit pour l'app (fr.sosmiam.app), puis Paramètres → Comptes de service → « Générer une nouvelle clé privée ».
                  Dépose ce fichier sous le nom <code>/root/sos-miam-secrets/push-google.json</code>.
                </li>
              )}
            </ul>
            <p className="text-[13px] text-gris">Puis <code>chmod 600</code> sur chaque fichier. Pas besoin de redémarrer : l'envoi les lit à chaque fois.</p>
          </div>
        )}
        <p className="text-[13px] text-gris">Les téléphones s'inscriront tout seuls quand l'app sortira et que la personne acceptera les notifications.</p>
      </div>
    </Carte>
  );
}
