import { Copy, KeyRound, Mail, Trash2, UserMinus } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { BoutonReponseType } from "~/composants/interface/BoutonReponseType.tsx";
import { ModaleEcrireMail } from "~/composants/interface/ModaleEcrireMail.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { reinitialiserMotDePasse, retirerDuProgramme, supprimerCompteAmbassadeur, type FicheAmbassadeur } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { copier } from "~/services/systeme.ts";

/** onSupprime : le rôle ou le compte n'existe plus, la fiche se ferme */
type Props = { fiche: FicheAmbassadeur; onSupprime: () => void };

/**
 * Le compte lui-même : mot de passe oublié (lien à lui transmettre), mail écrit et envoyé depuis le logiciel, retrait du programme (le compte et l'app
 * restent) ou suppression de tout le compte SOS Miam (un seul compte pour l'app, l'espace ambassadeur et l'espace pro).
 */
export function AccesAmbassadeur({ fiche, onSupprime }: Props) {
  const [lien, setLien] = useState<{ adresse: string; expireLe: string } | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const [ecrireLien, setEcrireLien] = useState(false);
  const destinataire = { compteId: fiche.id, adresse: fiche.email, prenom: fiche.prenom };

  async function agir(action: () => Promise<void>) {
    setEtat({ enCours: true, texte: null });
    try {
      await action();
      setEtat((avant) => ({ ...avant, enCours: false }));
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  /** envoyer : le serveur l'envoie à son adresse (le lien ne passe pas par toi) ; sinon, ou si l'envoi rate, il s'affiche */
  const preparerLien = (envoyer: boolean) =>
    agir(async () => {
      const reponse = await reinitialiserMotDePasse(fiche.id, envoyer);
      if (reponse.envoye) {
        setLien(null);
        setEtat({ enCours: false, texte: `Lien envoyé à ${fiche.email} ✅ Il marche jusqu'au ${formaterDate(reponse.expireLe, true)}, une seule fois.` });
        return;
      }
      setLien({ adresse: reponse.lien, expireLe: reponse.expireLe });
      if (envoyer) setEtat({ enCours: false, texte: "L'envoi par mail n'a pas marché (réglages de la boîte ?) : voici le lien à lui transmettre toi-même." });
    });

  const retirer = () =>
    window.confirm(
      `Retirer ${fiche.prenom} du programme ambassadeur ? Sa fiche d'ambassadeur, ses missions, ses messages et sa candidature fondateur partent. Son compte SOS Miam, l'app, ses points et ses badges restent.`,
    ) && agir(async () => {
      await retirerDuProgramme(fiche.id);
      onSupprime();
    });

  const supprimer = () =>
    window.confirm(
      `Supprimer TOUT le compte SOS Miam de ${fiche.prenom}, app comprise ? Points, badges, missions, messages, candidature : tout part. À faire seulement s'il le demande. Impossible de revenir en arrière.`,
    ) && agir(async () => {
      await supprimerCompteAmbassadeur(fiche.id);
      onSupprime();
    });

  const corpsMail = lien
    ? [`Salut ${fiche.prenom} !`, "", `Voici ton lien pour choisir un nouveau mot de passe (valable jusqu'au ${formaterDate(lien.expireLe, true)}, une seule fois) :`, lien.adresse, "", "À très vite,", "Hugo, pour SOS Miam"].join("\n")
    : "";

  return (
    <section className="grid gap-3">
      <h3 className="font-extrabold">Compte</h3>
      <div className="flex flex-wrap gap-2">
        <BoutonEcrireMail destinataire={destinataire} categorie="ambassadeur" />
        <BoutonReponseType categorie="ambassadeur" adresse={fiche.email} compteId={fiche.id} prenom={fiche.prenom} />
        <Bouton petit icone={KeyRound} chargement={etat.enCours && !lien} onClick={() => preparerLien(true)}>Envoyer un lien « mot de passe oublié »</Bouton>
        <Bouton petit variante="discret" desactive={etat.enCours} onClick={() => preparerLien(false)}>Préparer le lien sans l'envoyer</Bouton>
        <Bouton petit icone={UserMinus} desactive={etat.enCours} onClick={retirer}>Retirer du programme</Bouton>
        <Bouton petit variante="danger" icone={Trash2} desactive={etat.enCours} onClick={supprimer}>Supprimer tout le compte</Bouton>
      </div>
      {lien && (
        <div className="grid gap-2 rounded-xl bg-creme p-3 text-sm">
          <p>
            Lien à lui transmettre toi-même, valable jusqu'au <strong>{formaterDate(lien.expireLe, true)}</strong>, une seule fois.
            Envoie-le seulement à son adresse ({fiche.email}) : qui l'a peut changer son mot de passe.
          </p>
          <code className="block overflow-x-auto rounded-lg bg-white px-2 py-1 text-xs whitespace-nowrap">{lien.adresse}</code>
          <div className="flex flex-wrap gap-2">
            <Bouton petit icone={Mail} onClick={() => setEcrireLien(true)}>L'envoyer par mail…</Bouton>
            <Bouton petit icone={Copy} onClick={() => copier(lien.adresse).then(() => setEtat({ enCours: false, texte: "Lien copié." }))}>Copier</Bouton>
          </div>
        </div>
      )}
      {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
      <ModaleEcrireMail
        ouverte={ecrireLien}
        onFermer={() => setEcrireLien(false)}
        destinataire={destinataire}
        objet="Ton nouveau mot de passe SOS Miam"
        texte={corpsMail}
        onEnvoye={(bilan) => setEtat({ enCours: false, texte: bilan })}
      />
    </section>
  );
}
