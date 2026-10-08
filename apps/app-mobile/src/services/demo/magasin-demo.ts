// Le magasin vivant du faux serveur de démo : lu une fois sur le téléphone, puis gardé en mémoire. Les lectures et les
// modifications passent l'une après l'autre (jamais deux en même temps) ; chaque passage expire ce qui doit l'être.
// Une modification travaille sur une copie : si elle plante, rien n'est abîmé. Les écouteurs sont prévenus après coup.
import { effacerMagasinDemo, enregistrerMagasinDemo, lireMagasinDemo } from "~/stockage/magasin-demo";

import { creerMagasinInitial } from "./creer-magasin-initial";
import { expirerDemo } from "./expirer-demo";
import type { MagasinDemo, MagasinDemoVivant } from "./types-demo";

/**
 * Crée le magasin de démo. Les fonctions passées à `lire` et `modifier` doivent être synchrones (tout le travail se fait
 * dans l'appel) et ne rien garder de l'objet reçu : on rend des copies (convertirVisiteDemo, convertirCarteDemo…).
 */
export function creerMagasinDemo(o: { maintenant: () => number }): MagasinDemoVivant {
  let magasin: MagasinDemo | null = null;
  let chargement: Promise<MagasinDemo> | null = null;
  let file: Promise<unknown> = Promise.resolve();
  const ecouteurs = new Set<() => void>();

  function prevenir() {
    // Après coup : un écouteur qui relit aussitôt passe derrière la modification en cours
    setTimeout(() => {
      ecouteurs.forEach((ecouteur) => {
        try {
          ecouteur();
        } catch {
          // Un écran qui plante ne doit pas priver les autres de la nouvelle
        }
      });
    }, 0);
  }

  function charger(): Promise<MagasinDemo> {
    if (magasin) return Promise.resolve(magasin);
    if (!chargement) {
      chargement = lireMagasinDemo()
        .then((lu) => {
          magasin = lu ?? creerMagasinInitial(o.maintenant());
          return magasin;
        })
        .catch((erreur: unknown) => {
          chargement = null;
          throw erreur;
        });
    }
    return chargement;
  }

  function enFile<T>(travail: () => Promise<T>): Promise<T> {
    const suite = file.then(travail, travail);
    file = suite.catch(() => {});
    return suite;
  }

  async function enregistrer(m: MagasinDemo) {
    try {
      await enregistrerMagasinDemo(m);
    } catch {
      // Le téléphone refuse d'écrire : la démo continue en mémoire
    }
  }

  return {
    lire(fn) {
      return enFile(async () => {
        const m = await charger();
        const maintenantMs = o.maintenant();
        if (expirerDemo(m, maintenantMs)) {
          await enregistrer(m);
          prevenir();
        }
        return fn(m, maintenantMs);
      });
    },

    modifier(fn) {
      return enFile(async () => {
        const avant = JSON.stringify(await charger());
        const copie = JSON.parse(avant) as MagasinDemo;
        const maintenantMs = o.maintenant();
        expirerDemo(copie, maintenantMs);
        const resultat = fn(copie, maintenantMs);
        magasin = copie;
        if (JSON.stringify(copie) !== avant) {
          await enregistrer(copie);
          prevenir();
        }
        return resultat;
      });
    },

    ecouter(rappel) {
      ecouteurs.add(rappel);
      return () => {
        ecouteurs.delete(rappel);
      };
    },

    remettreAZero() {
      return enFile(async () => {
        // Le magasin neuf n'est écrit qu'à la prochaine modification : après « Tout effacer », la clé reste vide
        magasin = creerMagasinInitial(o.maintenant());
        chargement = null;
        try {
          await effacerMagasinDemo();
        } catch {
          // Rien à effacer, ou le téléphone refuse : le magasin neuf est déjà en mémoire
        }
        prevenir();
      });
    },
  };
}
