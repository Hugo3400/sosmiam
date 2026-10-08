import { Copy, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { changerMotDePasseCoffre } from "~/fonctions/securite/changer-mot-de-passe-coffre.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ADRESSE_API } from "~/services/client-gestion.ts";
import { copier } from "~/services/systeme.ts";
import { ecrireCoffre, type CoffreCle } from "~/stockage/coffre-local.ts";
import { CarteMiseAJour } from "./CarteMiseAJour.tsx";
import { CarteVerrouillage } from "./CarteVerrouillage.tsx";

type Props = {
  coffre: CoffreCle;
  onCoffreChange: (coffre: CoffreCle) => void;
  onOublierPoste: () => void;
  minutesVerrou: number | null;
  onMinutesVerrou: (minutes: number | null) => void;
};

/** Réglages de ce poste : son identité, son mot de passe, et comment le retirer. */
export function EcranReglages({ coffre, onCoffreChange, onOublierPoste, minutesVerrou, onMinutesVerrou }: Props) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; message: string | null; erreur: string | null }>({ enCours: false, message: null, erreur: null });

  async function changer(evenement: FormEvent) {
    evenement.preventDefault();
    if (nouveau.length < 12) return setEtat({ enCours: false, message: null, erreur: "Le nouveau mot de passe doit faire 12 caractères au moins." });
    setEtat({ enCours: true, message: null, erreur: null });
    try {
      const rechiffre = await changerMotDePasseCoffre(coffre, ancien, nouveau);
      ecrireCoffre(rechiffre);
      onCoffreChange(rechiffre);
      setAncien("");
      setNouveau("");
      setEtat({ enCours: false, message: "Mot de passe changé ✅ (rien à refaire sur le serveur)", erreur: null });
    } catch {
      setEtat({ enCours: false, message: null, erreur: "L'ancien mot de passe n'est pas le bon." });
    }
  }

  return (
    <>
      <EnTeteEcran titre="Réglages" sousTitre="Ce poste, sa clé et sa sécurité." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Carte titre={<span className="flex items-center gap-2"><ShieldCheck className="size-4" aria-hidden /> Ce poste</span>}>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
            <dt className="text-gris">Identifiant</dt><dd className="font-mono font-semibold">{coffre.idPoste}</dd>
            <dt className="text-gris">Clé créée le</dt><dd>{formaterDate(coffre.creeLe, true)}</dd>
            <dt className="text-gris">Serveur</dt><dd className="font-mono text-[13px] break-all">{ADRESSE_API}</dd>
            <dt className="text-gris">Protection</dt><dd>Clé Ed25519 chiffrée (AES-256-GCM, {coffre.iterations.toLocaleString("fr-FR")} tours PBKDF2), code à 6 chiffres (session de 7 jours au plus, 24 h sans activité)</dd>
          </dl>
          <Bouton petit icone={Copy} className="mt-4" onClick={() => copier(coffre.clePublique)}>Copier la clé publique</Bouton>
        </Carte>
        <Carte titre={<span className="flex items-center gap-2"><KeyRound className="size-4" aria-hidden /> Changer le mot de passe</span>}>
          <form onSubmit={changer} className="grid gap-3">
            <Champ libelle="Mot de passe actuel" type="password" autoComplete="current-password" valeur={ancien} onChange={setAncien} />
            <Champ libelle="Nouveau mot de passe" type="password" autoComplete="new-password" valeur={nouveau} onChange={setNouveau} aide="12 caractères au moins." />
            {(etat.message || etat.erreur) && <p role="status" className={`text-sm font-semibold ${etat.erreur ? "text-rouge-texte" : "text-vert"}`}>{etat.erreur ?? etat.message}</p>}
            <Bouton type="submit" variante="principal" chargement={etat.enCours} className="justify-self-start">Changer</Bouton>
          </form>
        </Carte>
        <CarteVerrouillage minutes={minutesVerrou} onChange={onMinutesVerrou} />
        <CarteMiseAJour />
        <Carte titre="PC perdu, volé ou remplacé ?">
          <p className="text-sm">
            Sur le serveur, lance <code className="rounded bg-creme px-1.5 py-0.5 text-[13px]">npm run gestion:autoriser -- --retirer {coffre.idPoste}</code> :
            ce poste est coupé dans la seconde. Pour changer aussi le code à 6 chiffres : <code className="rounded bg-creme px-1.5 py-0.5 text-[13px]">npm run gestion:autoriser -- --nouveau-code</code>.
          </p>
          <Bouton variante="danger" icone={Trash2} className="mt-4" onClick={() => window.confirm("Effacer la clé de ce PC ? Il faudra en recréer une et l'autoriser à nouveau sur le serveur.") && onOublierPoste()}>
            Effacer la clé de ce PC
          </Bouton>
        </Carte>
      </div>
    </>
  );
}
