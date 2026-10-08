import { ExternalLink, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { envoyerAnnonce, listerAnnonces, retirerAnnonce } from "~/services/annonces.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ouvrirLien } from "~/services/systeme.ts";

/** Écrire une annonce et la faire publier par le bot dans le salon d'annonces du serveur Discord. */
export function EcranAnnonces() {
  const { donnees, erreur, recharger } = utiliserChargement(listerAnnonces, []);
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const enAttente = donnees?.some((a) => a.statut === "en-attente");

  // Tant qu'une annonce attend le bot, on regarde toutes les 10 secondes si elle est partie
  useEffect(() => {
    if (!enAttente) return;
    const minuteur = setInterval(recharger, 10_000);
    return () => clearInterval(minuteur);
  }, [enAttente, recharger]);

  async function envoyer() {
    if (!window.confirm(`Publier « ${titre} » sur le serveur Discord ?`)) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await envoyerAnnonce(titre, texte);
      setTitre("");
      setTexte("");
      setEtat({ enCours: false, erreur: null });
      recharger();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <>
      <EnTeteEcran
        titre="Annonces Discord"
        sousTitre="Le bot publie l'annonce dans le salon choisi avec /config annonces, en moins de 30 secondes. Mentions désactivées : personne n'est notifié par @everyone."
      />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Carte titre="Nouvelle annonce">
          <div className="grid gap-4">
            <Champ libelle="Titre" valeur={titre} maxLength={100} onChange={setTitre} placeholder="Montpellier, on arrive 🛟" />
            <ZoneTexte
              libelle="Texte"
              valeur={texte}
              onChange={setTexte}
              maximum={3500}
              lignes={10}
              aide="Mise en forme Discord : **gras**, *italique*, « - » pour une liste, et les liens tels quels."
            />
            {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
            <Bouton variante="principal" icone={Send} chargement={etat.enCours} desactive={!titre.trim() || !texte.trim()} onClick={envoyer} className="justify-self-start">
              Publier sur Discord
            </Bouton>
          </div>
        </Carte>
        <Carte titre="Annonces envoyées" sansMarge>
          <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
          {donnees && donnees.length === 0 && <p className="p-5 text-sm text-gris">Aucune annonce pour l'instant.</p>}
          <ul>
            {donnees?.map((annonce) => (
              <li key={annonce.id} className="grid gap-1 border-b border-ligne/70 px-5 py-3 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-semibold">{annonce.titre}</span>
                  <Badge ton={annonce.statut === "publiee" ? "vert" : annonce.statut === "echec" ? "rouge" : "jaune"}>
                    {annonce.statut === "publiee" ? "Publiée" : annonce.statut === "echec" ? "Ratée" : "En route…"}
                  </Badge>
                  {annonce.lienMessage && <Bouton petit variante="discret" icone={ExternalLink} titre="Voir sur Discord" onClick={() => ouvrirLien(annonce.lienMessage!)} />}
                  {annonce.statut !== "publiee" && <Bouton petit variante="discret" icone={Trash2} titre="Retirer" onClick={() => retirerAnnonce(annonce.id).then(recharger)} />}
                </div>
                <p className="text-xs text-gris">{formaterDate(annonce.publieeLe ?? annonce.creeLe, true)}</p>
                {annonce.erreur && <p className="text-sm text-rouge-texte">{annonce.erreur}</p>}
              </li>
            ))}
          </ul>
        </Carte>
      </div>
    </>
  );
}
