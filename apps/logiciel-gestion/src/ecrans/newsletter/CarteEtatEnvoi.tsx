import { MailWarning, Send } from "lucide-react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import type { EtatEnvois } from "~/services/courriels.ts";

const FICHIER = "/root/sos-miam-secrets/boite-bonjour.env";

/** État de l'envoi des mails (boîte bonjour@ chez l'hébergement mail) et, s'il n'est pas réglé, comment le régler. */
export function CarteEtatEnvoi({ etat }: { etat: EtatEnvois }) {
  if (etat.reglages !== "pret") {
    return (
      <Carte titre={<span className="flex items-center gap-2"><MailWarning className="size-4" aria-hidden /> L'envoi des mails n'est pas encore réglé</span>}>
        <div className="grid gap-3 text-sm">
          {etat.reglages === "mal-protege" && <p className="font-semibold text-rouge-texte">Le fichier existe mais d'autres comptes du serveur peuvent le lire : lance <code>chmod 600 {FICHIER}</code>.</p>}
          {etat.reglages === "incomplet" && <p className="font-semibold text-rouge-texte">Le fichier existe mais il manque le serveur, l'adresse ou le mot de passe.</p>}
          <ol className="grid list-decimal gap-2 pl-5">
            <li>Dans le panneau de ta boîte mail, onglet <strong>« Mots de passe d'applications »</strong>, crée un mot de passe « Serveur SOS Miam » (IMAP et SMTP seulement). Tu pourras le révoquer sans toucher au mot de passe de ta boîte.</li>
            <li>
              Sur le serveur, <strong>toi-même dans un terminal</strong> (jamais à travers Claude ni le logiciel), crée <code>{FICHIER}</code> avec :
              <pre className="mt-1 rounded-lg bg-creme px-3 py-2 text-[12px]">{"IMAP_SERVEUR=mail.yubox.io\nIMAP_UTILISATEUR=bonjour@sosmiam.fr\nIMAP_MOT_DE_PASSE=le-mot-de-passe-d-application\n# facultatif : SMTP_PORT=465 et ENVOI_PAR_HEURE=100"}</pre>
            </li>
            <li>Puis <code>chmod 600 {FICHIER}</code>. Ce même fichier sert à lire la boîte (désinscriptions) et à envoyer : rien d'autre à faire, l'envoi démarre tout seul.</li>
          </ol>
        </div>
      </Carte>
    );
  }
  return (
    <Carte titre={<span className="flex items-center gap-2"><Send className="size-4" aria-hidden /> Envoi des mails</span>}>
      <div className="grid gap-3 text-sm">
        {etat.probleme && (
          <p role="alert" className="rounded-xl bg-rose-alerte px-3 py-2 font-semibold text-rouge-texte">
            Les mails attendent : le serveur mail a répondu « {etat.probleme.message} » ({formaterDateRelative(etat.probleme.moment)}). Vérifie le mot de passe
            d'application dans <code>{FICHIER}</code> ; ils repartiront tout seuls.
          </p>
        )}
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
          <dt className="text-gris">Expéditeur</dt><dd className="truncate">{etat.expediteur}</dd>
          <dt className="text-gris">Serveur</dt><dd>{etat.serveur} (chiffré)</dd>
          <dt className="text-gris">Dernière heure</dt><dd className="chiffres">{etat.derniereHeure} / {etat.parHeure} mails au plus</dd>
          <dt className="text-gris">En attente</dt><dd className="chiffres">{etat.enAttente}</dd>
          <dt className="text-gris">Échecs (7 jours)</dt><dd className="chiffres">{etat.echecs7Jours}</dd>
          <dt className="text-gris">Dernier envoi</dt><dd>{etat.dernierEnvoi ? formaterDateRelative(etat.dernierEnvoi) : "aucun pour l'instant"}</dd>
        </dl>
      </div>
    </Carte>
  );
}
