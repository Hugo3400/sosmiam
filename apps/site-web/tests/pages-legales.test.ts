// Structure des pages légales (src/contenus/legal) : chaque page a ses chapitres, le sommaire suit les chapitres, aucune
// section n'est perdue, les ancres sont uniques, et les ancres déjà publiées (liens du site, de l'app, des mails) existent
// toujours. Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

// Les contenus importent « ~/… » (alias de src/) : on l'apprend à Node pour ce test
const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { regrouperEnChapitres } = await import("../src/fonctions/legal/regrouper-en-chapitres.ts");
const { pagesLegales, lienGererCookies } = await import("../src/contenus/legal/liens-legaux.ts");
const { groupesPiedDePage } = await import("../src/contenus/liens-pied-de-page.ts");

type Document = import("../src/contenus/legal/type-legal.ts").DocumentLegal;

const documents: Record<string, Document> = {
  "/mentions-legales": (await import("../src/contenus/legal/mentions-legales.ts")).documentMentionsLegales,
  "/confidentialite": (await import("../src/contenus/legal/confidentialite.ts")).documentConfidentialite,
  "/cookies": (await import("../src/contenus/legal/cookies.ts")).documentCookies,
  "/cgu": (await import("../src/contenus/legal/cgu.ts")).documentCgu,
  "/accessibilite": (await import("../src/contenus/legal/accessibilite.ts")).documentAccessibilite,
  "/age": (await import("../src/contenus/legal/age.ts")).documentAge,
  "/prevention": (await import("../src/contenus/legal/prevention.ts")).documentPrevention,
  "/statistiques": (await import("../src/contenus/legal/statistiques.ts")).documentStatistiques,
};

/** Ancres publiées avant le 14 octobre 2026 (section par section) : des liens y mènent, elles ne doivent jamais disparaître */
const ancresHistoriques: Record<string, string[]> = {
  "/mentions-legales": ["editeur", "directeur-publication", "hebergeur", "prestataires", "objet", "propriete-intellectuelle", "credits", "signaler-contenu", "donnees-cookies", "evolution"],
  "/confidentialite": [
    "en-bref", "responsable", "journaux", "statistiques", "cloudflare", "newsletter", "formulaire", "demande-lieu", "compte-ambassadeur",
    "compte-pro", "connexion-apple-google", "app", "app-comptes", "miam-safe", "messages", "ce-qu-on-ne-fait-pas", "destinataires",
    "securite", "droits", "exercer-tes-droits", "cnil", "mineurs", "a-venir", "mises-a-jour",
  ],
  "/cookies": ["definition", "aujourd-hui", "cloudflare", "plus-tard", "ton-choix", "navigateur", "contact"],
  "/cgu": [
    "objet", "acceptation", "acces", "contenu", "age", "compte", "rescousses", "ambassadeurs", "pro", "publications", "regles-communaute",
    "moderation", "propriete-intellectuelle", "bon-usage", "contributions", "liens", "responsabilite", "donnees-cookies", "modifications",
    "droit-applicable", "contact",
  ],
  "/accessibilite": ["app", "prevu", "site", "audit", "contact"],
  "/age": ["dix-huit-ans", "sans-compte", "contenus", "securite", "parents", "contact"],
  "/prevention": ["alcool", "route", "manger-bouger", "contact"],
  "/statistiques": ["ton-choix"],
};

/** Ancres posées par le cadre de la page (titre, En bref, sommaire, « À lire aussi ») */
const ANCRES_DU_CADRE = ["haut", "en-bref", "en-bref-titre", "sommaire", "sommaire-titre", "a-lire-aussi"];

function ancresDe(document: Document): string[] {
  return [
    ...ANCRES_DU_CADRE,
    ...document.chapitres.flatMap((chapitre) => [chapitre.id, `${chapitre.id}-titre`]),
    ...document.sections.map((section) => section.id),
  ];
}

for (const [adresse, document] of Object.entries(documents)) {
  test(`${adresse} : le sommaire suit les chapitres, et chaque section est dans un seul chapitre, dans l'ordre`, () => {
    const chapitres = regrouperEnChapitres(document);
    assert.ok(chapitres.length >= 2, "au moins deux chapitres");
    assert.deepEqual(chapitres.map((c) => c.numero), chapitres.map((_, i) => i + 1));
    assert.deepEqual(chapitres.map((c) => c.titre), document.chapitres.map((c) => c.titre));
    assert.deepEqual(chapitres.flatMap((c) => c.sections.map((s) => s.id)), document.sections.map((s) => s.id));
    for (const chapitre of chapitres) assert.ok(chapitre.sections.length > 0, `chapitre vide : ${chapitre.titre}`);
  });

  test(`${adresse} : ancres uniques, en minuscules avec des tirets`, () => {
    const ancres = ancresDe(document);
    const doublons = ancres.filter((ancre, i) => ancres.indexOf(ancre) !== i);
    assert.deepEqual(doublons, []);
    for (const ancre of ancres) assert.match(ancre, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test(`${adresse} : les ancres déjà publiées existent toujours`, () => {
    const ancres = ancresDe(document);
    for (const ancre of ancresHistoriques[adresse]) assert.ok(ancres.includes(ancre), `ancre disparue : ${adresse}#${ancre}`);
  });

  test(`${adresse} : un En bref, une date de mise à jour, et les liens « #… » internes mènent quelque part`, () => {
    assert.ok(document.enBref.length > 0);
    assert.match(document.miseAJour, /^\d{1,2}(er)? [a-zéû]+ \d{4}$/);
    const texte = JSON.stringify([document.introduction, document.enBref, document.sections]);
    const ancres = ancresDe(document);
    for (const [, page, ancre] of texte.matchAll(/\]\((\/[a-z-]*)?#([a-z0-9-]+)\)/g)) {
      const cible = page ? documents[page] : document;
      if (!cible) continue; // page hors des pages légales (accueil, FAQ…)
      assert.ok(ancresDe(cible).includes(ancre), `lien cassé : ${page ?? adresse}#${ancre}`);
    }
  });
}

test("toutes les pages légales sont dans le pied de page, avec « Gérer mes cookies » vers /cookies#mes-choix", () => {
  assert.deepEqual(pagesLegales.map((page) => page.href).sort(), Object.keys(documents).sort());
  const infos = groupesPiedDePage.find((groupe) => groupe.titre === "Infos légales");
  assert.ok(infos);
  assert.deepEqual(infos.liens.map((lien) => lien.adresse), [...pagesLegales.map((page) => page.href), "/cookies#mes-choix"]);
  assert.equal(lienGererCookies.href, "/cookies#mes-choix");
  assert.ok(documents["/cookies"].sections.some((section) => section.id === "mes-choix"));
});

test("regrouperEnChapitres refuse une section oubliée ou citée deux fois", () => {
  const section = (id: string) => ({ id, titre: id, blocs: [] });
  const base = { titre: "Essai", sections: [section("a"), section("b")] };
  assert.throws(() => regrouperEnChapitres({ ...base, chapitres: [{ id: "c1", titre: "Un", sections: ["a"] }] }));
  assert.throws(() => regrouperEnChapitres({ ...base, chapitres: [{ id: "c1", titre: "Un", sections: ["a", "b", "b"] }] }));
  assert.throws(() => regrouperEnChapitres({ ...base, chapitres: [{ id: "c1", titre: "Un", sections: ["b", "a"] }] }));
});
