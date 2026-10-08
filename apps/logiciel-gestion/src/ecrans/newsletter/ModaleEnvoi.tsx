import { FlaskConical, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { creerHtmlNewsletter, PIED_AMBASSADEURS } from "~/fonctions/newsletter/creer-html-newsletter.ts";
import { creerTexteNewsletter } from "~/fonctions/newsletter/creer-texte-newsletter.ts";
import { decrirePublic } from "~/fonctions/newsletter/decrire-public.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { envoyerEssai, lancerEnvoi, lireEtatEnvois, listerDestinataires, type PublicEnvoi } from "~/services/courriels.ts";
import { listerInscrits } from "~/services/newsletter.ts";
import { ChoixDestinataires } from "./ChoixDestinataires.tsx";

type Props = { objet: string; texte: string; brouillonId: number | null; onFermer: () => void; onLance: (bilan: string) => void };

/** Envoyer une newsletter (ou un mail aux ambassadeurs) : à qui, un essai à soi-même, puis l'envoi pour de vrai. */
export function ModaleEnvoi({ objet, texte, brouillonId, onFermer, onLance }: Props) {
  const [cible, setCible] = useState<PublicEnvoi>({ public: "newsletter", ville: "", candidats: false, beta: false, telephone: "" });
  // La ville se tape : on attend que la frappe s'arrête avant de recharger la liste
  const [cibleStable, setCibleStable] = useState(cible);
  useEffect(() => {
    const minuteur = setTimeout(() => setCibleStable(cible), 300);
    return () => clearTimeout(minuteur);
  }, [cible]);
  const liste = utiliserChargement(() => listerDestinataires(cibleStable), [JSON.stringify(cibleStable)]);
  const [decoches, setDecoches] = useState<Set<string>>(new Set());
  useEffect(() => setDecoches(new Set()), [liste.donnees]);
  const villes = utiliserChargement(() => listerInscrits({ recherche: "", ville: "", ambassadeur: false, beta: false, telephone: "", relance: false, page: 1 }), []);
  const etatEnvoi = utiliserChargement(lireEtatEnvois, []);
  const [essai, setEssai] = useState("bonjour@sosmiam.fr");
  const [etat, setEtat] = useState<{ enCours: "essai" | "envoi" | null; message: string | null; erreur: boolean }>({ enCours: null, message: null, erreur: false });

  const pourAmbassadeurs = cible.public === "ambassadeurs";
  const contenu = {
    objet,
    html: creerHtmlNewsletter(objet, texte, pourAmbassadeurs ? PIED_AMBASSADEURS : undefined),
    texte: creerTexteNewsletter(objet, texte, pourAmbassadeurs),
  };
  const destinataires = liste.donnees?.destinataires ?? [];
  const choisis = destinataires.filter((d) => !decoches.has(d.adresse)).map((d) => d.adresse);
  const pret = etatEnvoi.donnees?.reglages === "pret";

  async function agir(quoi: "essai" | "envoi") {
    if (quoi === "envoi" && !window.confirm(`Envoyer « ${objet} » à ${choisis.length} personne${choisis.length > 1 ? "s" : ""} ? Impossible de rattraper un mail parti.`)) return;
    setEtat({ enCours: quoi, message: null, erreur: false });
    try {
      if (quoi === "essai") {
        await envoyerEssai(essai.trim(), contenu);
        setEtat({ enCours: null, message: `Essai envoyé à ${essai.trim()} ✅ Va voir le rendu dans ta messagerie.`, erreur: false });
        return;
      }
      const { total } = await lancerEnvoi({
        ...cible, ...contenu, adresses: choisis, brouillonId, description: decrirePublic(cible, choisis.length, destinataires.length),
      });
      onLance(`Envoi lancé : ${total} mail${total > 1 ? "s partent" : " part"} (${etatEnvoi.donnees?.parHeure ?? 100} par heure au plus). Suis-le dans « Envois ».`);
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: null, message: erreur?.champ === "adresse" ? "Cette adresse d'essai ne va pas." : expliquerErreur(erreur), erreur: true });
    }
  }

  return (
    <Modale
      large
      titre={`Envoyer « ${objet} »`}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={Send} desactive={!pret || choisis.length === 0} chargement={etat.enCours === "envoi"} onClick={() => agir("envoi")}>
            Envoyer à {choisis.length} personne{choisis.length > 1 ? "s" : ""}
          </Bouton>
        </>
      }
    >
      <div className="grid gap-5">
        {etatEnvoi.donnees && !pret && (
          <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">
            L'envoi des mails n'est pas encore réglé sur le serveur : regarde l'onglet « Envois » pour savoir quoi faire.
          </p>
        )}
        <ChoixDestinataires
          cible={cible}
          onCible={setCible}
          destinataires={liste.donnees ? destinataires : null}
          decoches={decoches}
          onDecoches={setDecoches}
          villes={villes.donnees?.villes.map((v) => v.ville) ?? []}
          synchronisee={liste.donnees?.synchronisee ?? true}
        />
        <section className="grid gap-2 rounded-xl bg-creme p-3">
          <p className="text-sm font-semibold">D'abord un essai ?</p>
          <div className="flex flex-wrap items-end gap-2">
            <Champ libelle="Adresse de l'essai" type="email" valeur={essai} onChange={setEssai} className="w-72" />
            <Bouton icone={FlaskConical} desactive={!pret || !essai.trim()} chargement={etat.enCours === "essai"} onClick={() => agir("essai")}>Envoyer un essai</Bouton>
          </div>
          <p className="text-[13px] text-gris">L'objet commence par « [Essai] ». Le pied de page change selon le public : désinscription pour la newsletter, un mot pour les ambassadeurs.</p>
        </section>
        {etat.message && <p role={etat.erreur ? "alert" : "status"} className={`text-sm font-semibold ${etat.erreur ? "text-rouge-texte" : "text-vert"}`}>{etat.message}</p>}
      </div>
    </Modale>
  );
}
