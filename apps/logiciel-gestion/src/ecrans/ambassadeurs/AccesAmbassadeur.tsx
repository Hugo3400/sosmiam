import { Copy, KeyRound, Mail, Trash2, UserMinus } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { creerLienCourrielGroupe } from "~/fonctions/texte/creer-lien-courriel-groupe.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { reinitialiserMotDePasse, retirerDuProgramme, supprimerCompteAmbassadeur, type FicheAmbassadeur } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { copier, ouvrirLien } from "~/services/systeme.ts";

/** onSupprime : le rôle ou le compte n'existe plus, la fiche se ferme */
type Props = { fiche: FicheAmbassadeur; onSupprime: () => void };

/**
 * Le compte lui-même : mot de passe oublié (lien à lui transmettre), mail direct, retrait du programme (le compte et l'app
 * restent) ou suppression de tout le compte SOS Miam (un seul compte pour l'app, l'espace ambassadeur et l'espace pro).
 */
export function AccesAmbassadeur({ fiche, onSupprime }: Props) {
  const [lien, setLien] = useState<{ adresse: string; expireLe: string } | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });

  async function agir(action: () => Promise<void>) {
    setEtat({ enCours: true, texte: null });
    try {
      await action();
      setEtat((avant) => ({ ...avant, enCours: false }));
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  const preparerLien = () =>
    agir(async () => {
      const { lien: adresse, expireLe } = await reinitialiserMotDePasse(fiche.id);
      setLien({ adresse, expireLe });
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
    ? [`Salut ${fiche.prenom} !`, "", `Voici ton lien pour choisir un nouveau mot de passe (valable jusqu'au ${formaterDate(lien.expireLe, true)}) :`, lien.adresse, "", "À très vite,", "Hugo, pour SOS Miam"].join("\n")
    : "";

  return (
    <section className="grid gap-3">
      <h3 className="font-extrabold">Compte</h3>
      <div className="flex flex-wrap gap-2">
        <Bouton petit icone={Mail} onClick={() => ouvrirLien(creerLienCourrielGroupe([fiche.email], "SOS Miam 🛟"))}>Écrire par mail</Bouton>
        <Bouton petit icone={KeyRound} chargement={etat.enCours && !lien} onClick={preparerLien}>Mot de passe oublié</Bouton>
        <Bouton petit icone={UserMinus} desactive={etat.enCours} onClick={retirer}>Retirer du programme</Bouton>
        <Bouton petit variante="danger" icone={Trash2} desactive={etat.enCours} onClick={supprimer}>Supprimer tout le compte</Bouton>
      </div>
      {lien && (
        <div className="grid gap-2 rounded-xl bg-creme p-3 text-sm">
          <p>
            Lien à lui transmettre toi-même, valable jusqu'au <strong>{formaterDate(lien.expireLe, true)}</strong>.
            Envoie-le seulement à son adresse ({fiche.email}) : qui l'a peut changer son mot de passe.
          </p>
          <code className="block overflow-x-auto rounded-lg bg-white px-2 py-1 text-xs whitespace-nowrap">{lien.adresse}</code>
          <div className="flex flex-wrap gap-2">
            <Bouton petit icone={Mail} onClick={() => ouvrirLien(`mailto:${encodeURIComponent(fiche.email)}?subject=${encodeURIComponent("Ton nouveau mot de passe SOS Miam")}&body=${encodeURIComponent(corpsMail)}`)}>
              L'envoyer par mail
            </Bouton>
            <Bouton petit icone={Copy} onClick={() => copier(lien.adresse).then(() => setEtat({ enCours: false, texte: "Lien copié." }))}>Copier</Bouton>
          </div>
        </div>
      )}
      {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
    </section>
  );
}
