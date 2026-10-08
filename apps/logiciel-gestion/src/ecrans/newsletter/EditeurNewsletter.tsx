import { Copy, FilePlus2, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import type { JSONContent } from "@tiptap/react";

import { EditeurTexteRiche } from "~/composants/editeur/EditeurTexteRiche.tsx";
import { STYLES_COURRIEL } from "~/contenus/styles-courriel.ts";
import { rendreTexteBrut } from "~/fonctions/editeur/rendre-texte-brut.ts";
import { convertirMarkdown } from "~/fonctions/newsletter/convertir-markdown.ts";
import { creerHtmlNewsletter } from "~/fonctions/newsletter/creer-html-newsletter.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ModaleEnvoi } from "./ModaleEnvoi.tsx";
import { enregistrerBrouillon, lireBrouillon, listerBrouillons, supprimerBrouillon } from "~/services/newsletter.ts";
import { copier } from "~/services/systeme.ts";

/** Modèle d'une nouvelle newsletter (écrit en Markdown simple, converti pour l'éditeur) */
const MODELE = `# Des nouvelles de SOS Miam 🛟

Salut !

Petit point sur ce qui se prépare : **...**

## Ce qui arrive bientôt

- Une nouvelle ville
- Les premiers lieux à sauver

Tu as une pépite à nous faire découvrir ? Réponds à ce mail, on lit tout.

À très vite,
Hugo`;

const DOCUMENT_VIDE: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
/** Un ancien brouillon (Markdown) ou le modèle, en HTML que l'éditeur sait lire */
const versHtml = (markdown: string) => convertirMarkdown(markdown, STYLES_COURRIEL);

/** Rédaction des newsletters : éditeur visuel, brouillons gardés sur le serveur, aperçu fidèle de l'e-mail, puis l'envoi. */
export function EditeurNewsletter() {
  const liste = utiliserChargement(listerBrouillons, []);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [objet, setObjet] = useState("");
  // Ce que l'éditeur reçoit au départ (et sa clé : la changer recrée l'éditeur), puis le document tel qu'il évolue
  const [depart, setDepart] = useState<{ cle: number; contenu: JSONContent | string }>({ cle: 0, contenu: DOCUMENT_VIDE });
  const [document, setDocument] = useState<JSONContent>(DOCUMENT_VIDE);
  const [modifie, setModifie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; message: string | null; erreur: string | null }>({ enCours: false, message: null, erreur: null });

  // Ouvre le premier brouillon de la liste, ou une page blanche s'il n'y en a pas
  useEffect(() => {
    if (choisi === null && liste.donnees && liste.donnees.length > 0) ouvrir(liste.donnees[0]!.id);
    else if (choisi === null && liste.donnees && liste.donnees.length === 0) nouvelle();
  }, [liste.donnees]);

  async function ouvrir(id: number) {
    setEtat({ enCours: true, message: null, erreur: null });
    try {
      const brouillon = await lireBrouillon(id);
      setChoisi(brouillon.id);
      setObjet(brouillon.objet);
      setDepart({ cle: Date.now(), contenu: brouillon.contenu ?? versHtml(brouillon.texte) });
      setModifie(false);
      setEtat({ enCours: false, message: null, erreur: null });
    } catch (probleme) {
      setEtat({ enCours: false, message: null, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }
  function nouvelle() {
    setChoisi(0);
    setObjet("Des nouvelles de SOS Miam 🛟");
    setDepart({ cle: Date.now(), contenu: versHtml(MODELE) });
    setModifie(true);
  }
  async function enregistrer() {
    setEtat({ enCours: true, message: null, erreur: null });
    try {
      const brouillon = await enregistrerBrouillon(choisi || null, { objet, texte: rendreTexteBrut(document), contenu: document });
      setChoisi(brouillon.id);
      setModifie(false);
      setEtat({ enCours: false, message: "Enregistré ✅", erreur: null });
      liste.recharger();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, message: null, erreur: erreur?.champ === "objet" ? "Il faut un objet (150 caractères au plus)." : expliquerErreur(erreur) });
    }
  }
  async function supprimer() {
    if (!choisi || !window.confirm(`Supprimer la newsletter « ${objet} » ?`)) return;
    await supprimerBrouillon(choisi).catch(() => {});
    setChoisi(null);
    liste.recharger();
  }

  const html = creerHtmlNewsletter(objet, document);
  const vide = !rendreTexteBrut(document).trim();
  return (
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <Carte titre="Newsletters" actions={<Bouton petit icone={FilePlus2} titre="Nouvelle newsletter" onClick={nouvelle} />} sansMarge>
        <MessageErreur erreur={liste.erreur} reessayer={liste.recharger} />
        {liste.chargement && !liste.donnees && <Chargement texte="…" />}
        <ul className="grid p-2">
          {choisi === 0 && <li className="rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">Nouvelle (pas encore enregistrée)</li>}
          {liste.donnees?.map((brouillon) => (
            <li key={brouillon.id}>
              <button
                type="button"
                onClick={() => ouvrir(brouillon.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${brouillon.id === choisi ? "bg-jaune-clair font-semibold" : "hover:bg-creme"}`}
              >
                <span className="line-clamp-2">{brouillon.objet}</span>
                <span className="text-xs text-gris">modifiée {formaterDateRelative(brouillon.modifieLe)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Carte>

      {choisi !== null && (
        <div className="grid gap-5 2xl:grid-cols-2">
          <Carte
            titre={<span className="flex items-center gap-2">Rédaction {modifie && <Badge ton="jaune">Pas enregistrée</Badge>}</span>}
            actions={
              <>
                {choisi > 0 && <Bouton petit variante="discret" icone={Trash2} titre="Supprimer" onClick={supprimer} />}
                <Bouton petit variante="principal" icone={Save} chargement={etat.enCours} onClick={enregistrer}>Enregistrer</Bouton>
              </>
            }
          >
            <div className="grid gap-4">
              <Champ libelle="Objet du mail" valeur={objet} maxLength={150} onChange={(v) => { setObjet(v); setModifie(true); }} />
              <div className="grid gap-1.5">
                <p className="text-sm font-semibold">Texte</p>
                <EditeurTexteRiche
                  key={depart.cle}
                  libelle="Texte de la newsletter"
                  contenuInitial={depart.contenu}
                  onPret={setDocument}
                  onChange={(nouveau) => { setDocument(nouveau); setModifie(true); }}
                  placeholder="Salut ! Raconte ce qui se passe chez SOS Miam…"
                />
                <p className="text-[13px] text-gris">Sélectionne du texte pour le mettre en forme. Ctrl+K ajoute un lien ; le bouton jaune sert d'appel à l'action.</p>
              </div>
              {(etat.message || etat.erreur) && <p role="status" className={`text-sm font-semibold ${etat.erreur ? "text-rouge-texte" : "text-vert"}`}>{etat.erreur ?? etat.message}</p>}
            </div>
          </Carte>
          <Carte
            titre="Aperçu de l'e-mail"
            actions={
              <>
                <Bouton petit icone={Copy} onClick={() => copier(html).then(() => setEtat({ enCours: false, message: "HTML copié dans le presse-papiers.", erreur: null }))}>Copier le HTML</Bouton>
                <Bouton petit variante="principal" icone={Send} desactive={!objet.trim() || vide} onClick={() => setEnvoi(true)}>Envoyer…</Bouton>
              </>
            }
            sansMarge
          >
            <iframe title="Aperçu de la newsletter" srcDoc={html} sandbox="" className="h-[640px] w-full rounded-b-carte bg-creme" />
          </Carte>
        </div>
      )}
      {envoi && (
        <ModaleEnvoi
          objet={objet}
          document={document}
          brouillonId={choisi && !modifie ? choisi : null}
          onFermer={() => setEnvoi(false)}
          onLance={(bilan) => { setEnvoi(false); setEtat({ enCours: false, message: bilan, erreur: null }); }}
        />
      )}
    </div>
  );
}
