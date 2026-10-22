import { RotateCw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { comparerVersionsApp } from "~/fonctions/versions/comparer-versions-app.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ecrireVersionsApp, lireVersionsApp, type VersionsApp } from "~/services/versions-app.ts";

const SYSTEMES = [{ cle: "ios", nom: "iPhone (iOS)" }, { cle: "android", nom: "Android" }] as const;
const FORME = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;

export function EcranVersionsApp() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireVersionsApp, []);
  const [saisie, setSaisie] = useState<VersionsApp | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null; message: string | null }>({ enCours: false, erreur: null, message: null });
  useEffect(() => {
    if (donnees) setSaisie({ minimale: { ...donnees.minimale }, derniere: { ...donnees.derniere } });
  }, [donnees]);

  if (!donnees || !saisie) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;
  const changer = (quoi: "minimale" | "derniere", systeme: "ios" | "android", valeur: string) => setSaisie({ ...saisie, [quoi]: { ...saisie[quoi], [systeme]: valeur.trim() } });
  const toutesValides = SYSTEMES.every(({ cle }) => FORME.test(saisie.minimale[cle]) && FORME.test(saisie.derniere[cle]));
  const trop = SYSTEMES.find(({ cle }) => toutesValides && comparerVersionsApp(saisie.minimale[cle], saisie.derniere[cle]) > 0);
  const minimaleMontee = SYSTEMES.filter(({ cle }) => toutesValides && comparerVersionsApp(saisie.minimale[cle], donnees.minimale[cle]) > 0);
  const change = SYSTEMES.some(({ cle }) => saisie.minimale[cle] !== donnees.minimale[cle] || saisie.derniere[cle] !== donnees.derniere[cle]);

  async function enregistrer() {
    setConfirmer(false);
    setEtat({ enCours: true, erreur: null, message: null });
    try {
      await ecrireVersionsApp(saisie!);
      setEtat({ enCours: false, erreur: null, message: "Versions enregistrées ✅ : l'app les lit à sa prochaine ouverture." });
      recharger();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), message: null });
    }
  }

  return (
    <>
      <EnTeteEcran
        titre="Versions de l'app"
        sousTitre="Sous la dernière version, l'app propose une fois la mise à jour. Sous la version minimale, elle bloque l'écran jusqu'à la mise à jour. Format « 1.2.3 » : monte la version de l'app à chaque publication."
        actions={<Bouton icone={RotateCw} onClick={recharger}>Actualiser</Bouton>}
      />
      {!donnees.fichier && <p className="mb-4 rounded-xl bg-jaune-clair px-4 py-2 text-sm">Pas encore réglé ici : l'API prend les valeurs par défaut de son environnement.</p>}
      {etat.message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{etat.message}</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {SYSTEMES.map(({ cle, nom }) => (
          <Carte key={cle} titre={nom}>
            <div className="grid gap-4">
              <Champ libelle="Dernière version (proposée en douceur)" valeur={saisie.derniere[cle]} onChange={(v) => changer("derniere", cle, v)} placeholder="1.0.0" erreur={FORME.test(saisie.derniere[cle]) ? null : "Format « 1.2.3 »"} />
              <Champ libelle="Version minimale (en dessous : bloqué)" valeur={saisie.minimale[cle]} onChange={(v) => changer("minimale", cle, v)} placeholder="1.0.0" erreur={FORME.test(saisie.minimale[cle]) ? null : "Format « 1.2.3 »"} />
            </div>
          </Carte>
        ))}
      </div>
      {trop && <p role="alert" className="mt-4 text-sm font-semibold text-rouge-texte">{trop.nom} : la version minimale ne peut pas dépasser la dernière version.</p>}
      {etat.erreur && <p role="alert" className="mt-4 text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      <Bouton
        variante="principal"
        icone={Save}
        className="mt-5"
        desactive={!toutesValides || Boolean(trop) || !change}
        chargement={etat.enCours}
        onClick={() => (minimaleMontee.length ? setConfirmer(true) : void enregistrer())}
      >
        Enregistrer
      </Bouton>
      <Modale
        titre="Bloquer les versions plus anciennes ?"
        ouverte={confirmer}
        onFermer={() => setConfirmer(false)}
        actions={<><Bouton onClick={() => setConfirmer(false)}>Annuler</Bouton><Bouton variante="danger" onClick={() => void enregistrer()}>Oui, bloquer</Bouton></>}
      >
        <p className="text-sm">
          Tu montes la version minimale pour {minimaleMontee.map((s) => `${s.nom} (${donnees.minimale[s.cle]} → ${saisie.minimale[s.cle]})`).join(" et ")}.
          Tous ceux qui ont une version plus ancienne seront <strong>bloqués</strong> jusqu'à leur mise à jour. Vérifie d'abord que la nouvelle version est bien en ligne sur le store.
        </p>
      </Modale>
    </>
  );
}
