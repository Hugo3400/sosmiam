import { MailCheck, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireBoite, synchroniserBoite } from "~/services/newsletter.ts";

/** Inscriptions arrivées par mail (ancienne page « Bientôt ») : synchronisation de la boîte bonjour@ et liste. */
export function CarteBoiteMail({ apresSynchro }: { apresSynchro: () => void }) {
  const { donnees, erreur, recharger } = utiliserChargement(lireBoite, []);
  const [etat, setEtat] = useState<{ enCours: boolean; message: string | null; ok: boolean }>({ enCours: false, message: null, ok: true });

  async function synchroniser() {
    setEtat({ enCours: true, message: null, ok: true });
    try {
      const resultat = await synchroniserBoite();
      setEtat({ enCours: false, message: resultat.message, ok: resultat.ok });
      recharger();
      apresSynchro();
    } catch (probleme) {
      setEtat({ enCours: false, message: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), ok: false });
    }
  }

  return (
    <Carte
      titre={<span className="flex items-center gap-2"><MailCheck className="size-4" aria-hidden /> Inscriptions reçues par mail</span>}
      actions={<Bouton petit icone={RefreshCw} chargement={etat.enCours} desactive={donnees ? !donnees.boiteConfiguree : true} onClick={synchroniser}>Synchroniser la boîte mail</Bouton>}
    >
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {donnees && (
        <div className="grid gap-3 text-sm">
          {!donnees.boiteConfiguree ? (
            <p className="rounded-xl bg-jaune-clair px-3 py-2">
              La boîte n'est pas encore branchée. Sur le serveur, crée toi-même <code className="text-[12px]">/root/sos-miam-secrets/boite-bonjour.env</code>{" "}
              (chmod 600) avec trois lignes : <code className="text-[12px]">IMAP_SERVEUR=mail.yubox.io</code>, <code className="text-[12px]">IMAP_UTILISATEUR=bonjour@sosmiam.fr</code>{" "}
              et <code className="text-[12px]">IMAP_MOT_DE_PASSE=…</code> (un mot de passe d'application de ta boîte). Le même fichier sert à l'envoi des mails :
              détails dans l'onglet « Envois ». Le mot de passe ne passe jamais par le logiciel.
            </p>
          ) : (
            <p>
              {donnees.derniereSynchro
                ? <>Dernière synchronisation {formaterDateRelative(donnees.derniereSynchro)} : <strong>{donnees.total}</strong> inscrit(s) en tout, formulaire et mails réunis.</>
                : "Pas encore synchronisée."}{" "}
              La synchronisation lit la boîte sans rien y changer, applique les désinscriptions (« STOP »…) et efface ces personnes de la base.
            </p>
          )}
          {etat.message && <pre className={`rounded-xl px-3 py-2 text-[12px] whitespace-pre-wrap ${etat.ok ? "bg-vert-clair text-vert" : "bg-rose-alerte text-rouge-texte"}`}>{etat.message}</pre>}
          {donnees.parMailSeulement.length > 0 && (
            <>
              <p className="font-semibold">Arrivés seulement par mail ({donnees.parMailSeulement.length}) :</p>
              <ul className="grid max-h-56 gap-1 overflow-y-auto">
                {donnees.parMailSeulement.map((inscrit) => (
                  <li key={inscrit.adresse} className="flex gap-3">
                    <span className="flex-1 font-semibold">{inscrit.adresse}</span>
                    <span className="text-gris">{inscrit.ville || "—"}</span>
                    <span className="chiffres text-gris">{inscrit.inscritLe ? formaterDate(inscrit.inscritLe) : ""}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Carte>
  );
}
