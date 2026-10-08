import { Carte } from "~/composants/interface/Carte.tsx";
import { ListeClassement } from "~/composants/interface/ListeClassement.tsx";
import { nommerLangue } from "~/fonctions/texte/nommer-langue.ts";
import { nommerPays } from "~/fonctions/texte/nommer-pays.ts";
import type { Dimension, Statistiques } from "~/services/statistiques.ts";

type Classement = { dimension: Dimension; titre: string; unite: string; nommer?: (valeur: string) => string; vide?: string };

const NOMS_CLICS: Record<string, string> = { site: "Le site", discord: "Discord", tiktok: "TikTok", instagram: "Instagram" };
/** Tranches de temps de réponse, dans l'ordre (pas du plus fréquent au moins fréquent) */
const ORDRE_TEMPS = ["< 100 ms", "100–300 ms", "300 ms–1 s", "> 1 s"];

export const GROUPES_CLASSEMENTS: { titre: string; classements: Classement[] }[] = [
  {
    titre: "Ce qu'on regarde",
    classements: [
      { dimension: "page", titre: "Pages les plus vues", unite: "pages vues" },
      { dimension: "entree", titre: "Pages d'arrivée", unite: "visites" },
      { dimension: "sortie", titre: "Pages de sortie", unite: "visites terminées" },
    ],
  },
  {
    titre: "D'où l'on vient",
    classements: [
      { dimension: "provenance", titre: "Provenances", unite: "visites" },
      { dimension: "campagne", titre: "Campagnes (utm_campaign)", unite: "visites", vide: "Aucune visite avec ?utm_campaign=… : ajoute-le à tes liens TikTok et Instagram." },
      { dimension: "clic", titre: "Clics sur les boutons de /liens", unite: "clics", nommer: (v) => NOMS_CLICS[v] ?? v },
    ],
  },
  {
    titre: "Qui vient",
    classements: [
      { dimension: "appareil", titre: "Appareils", unite: "visites" },
      { dimension: "navigateur", titre: "Navigateurs", unite: "visites" },
      { dimension: "systeme", titre: "Systèmes", unite: "visites" },
      { dimension: "langue", titre: "Langues", unite: "visites", nommer: nommerLangue },
      { dimension: "pays", titre: "Pays", unite: "visites", nommer: nommerPays },
      {
        dimension: "region",
        titre: "Régions",
        unite: "visites",
        vide: "Pas encore de région : dans Cloudflare, Règles → Transformations gérées → active « Ajouter les en-têtes de localisation du visiteur ».",
      },
      { dimension: "ville", titre: "Villes (approximatives)", unite: "visites" },
    ],
  },
  {
    titre: "Technique",
    classements: [
      { dimension: "temps", titre: "Temps de réponse", unite: "pages vues" },
      { dimension: "lente", titre: "Pages lentes (plus d'1 s)", unite: "fois", vide: "Aucune page lente 🚀" },
      { dimension: "introuvable", titre: "Pages introuvables (404)", unite: "demandes", vide: "Aucun lien cassé 👌" },
      { dimension: "robot", titre: "Passages de robots", unite: "pages", vide: "Aucun robot pour l'instant." },
    ],
  },
];

/** Tous les classements de la période affichée, regroupés par thème. */
export function GrilleClassements({ details }: { details: Statistiques["details"] }) {
  return (
    <>
      {GROUPES_CLASSEMENTS.map(({ titre, classements }) => (
        <section key={titre} className="grid gap-3">
          <h2 className="text-lg font-extrabold">{titre}</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {classements.map(({ dimension, titre: titreCarte, unite, nommer, vide }) => {
              const elements = details[dimension] ?? [];
              const ordonnes = dimension === "temps" ? [...elements].sort((a, b) => ORDRE_TEMPS.indexOf(a.valeur) - ORDRE_TEMPS.indexOf(b.valeur)) : elements;
              return (
                <Carte key={dimension} titre={titreCarte}>
                  <p className="-mt-1 mb-3 text-[13px] text-gris">En {unite}, sur toute la période affichée</p>
                  <ListeClassement elements={ordonnes} nommer={nommer} vide={vide ?? "Pas encore de visite sur cette période."} />
                </Carte>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
