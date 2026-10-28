import assert from "node:assert/strict";
import { test } from "node:test";

import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { direDeLieuLangue } from "~/fonctions/langue/dire-de-lieu-langue";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireHeureParisLangue } from "~/fonctions/langue/ecrire-heure-paris-langue";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { ecrireNombreCouvertsLangue } from "~/fonctions/langue/ecrire-nombre-couverts-langue";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { formaterMomentRelatifLangue } from "~/fonctions/langue/formater-moment-relatif-langue";
import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";
import { ecrireMoisAnnee } from "~/fonctions/dates/ecrire-mois-annee";
import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";
import { ecrireAttenteLangue } from "~/fonctions/langue/ecrire-attente-langue";
import { ecrireMoisAnneeLangue } from "~/fonctions/langue/ecrire-mois-annee-langue";
import { formaterIlYALangue } from "~/fonctions/langue/formater-il-y-a-langue";
import { formaterPrixLuLangue } from "~/fonctions/langue/formater-prix-lu-langue";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import { decrireReglementLangue } from "~/fonctions/langue/decrire-reglement-langue";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { formaterPrixLu } from "~/fonctions/prix/formater-prix-lu";
import { listerPrenoms } from "~/fonctions/texte/lister-prenoms";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";
import { ecrireNombreCouverts } from "~/fonctions/reservations/ecrire-nombre-couverts";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { ecrireMomentLong } from "~/fonctions/dates/ecrire-moment-long";
import { ecrireMomentLongLangue } from "~/fonctions/langue/ecrire-moment-long-langue";
import { decrireFinLimitation } from "~/fonctions/compte/decrire-fin-limitation";
import { decrireFinLimitationLangue } from "~/fonctions/langue/decrire-fin-limitation-langue";

const LIEUX = ["Chez Nonna Lia", "Restaurant du Capitaine Bouiboui", "Aux Pâtés de Lucette", "Le Chou Rieur", "Émile", "Sucre & Garrigue"];
const MAINTENANT = new Date(2026, 9, 28, 15, 0);
const INSTANTS = [new Date(2026, 9, 28, 14, 32), new Date(2026, 9, 27, 21, 0), new Date(2026, 9, 24, 9, 5), new Date(2026, 9, 1, 12, 0), new Date(2025, 2, 3, 8, 0)];

test("en français, chaque aide rend exactement l'ancienne fonction", () => {
  for (const nom of LIEUX) {
    assert.equal(direChezLieuLangue(nom, "fr"), direChezLieu(nom));
    assert.equal(direDeLieuLangue(nom, "fr"), direDeLieu(nom));
  }
  for (const n of [1, 2, 12]) {
    assert.equal(ecrireNombrePersonnesLangue(n, "fr"), ecrireNombrePersonnes(n));
    assert.equal(ecrireNombreCouvertsLangue(n, "fr"), ecrireNombreCouverts(n));
  }
  for (const km of [0.01, 0.35, 0.98, 1.1, 2, 9.96, 33.4]) assert.equal(formaterDistanceLangue(km, "fr"), formaterDistance(km));
  for (const iso of ["2004-03-12", "2026-10-01", "2026-12-25"]) assert.equal(ecrireDateLongueLangue(iso, "fr"), formaterDateLongue(iso));
  for (const instant of INSTANTS) {
    assert.equal(ecrireHeureLangue(instant, "fr"), ecrireHeure(instant));
    assert.equal(ecrireJourLongLangue(instant, "fr", MAINTENANT), ecrireJourLong(instant, MAINTENANT));
    assert.deepEqual(formaterMomentRelatifLangue(instant.toISOString(), "fr", MAINTENANT), formaterMomentRelatif(instant.toISOString(), MAINTENANT));
  }
});

test("en anglais : « at » devant un lieu, people et covers, point décimal, heures en 24 h, dates britanniques", () => {
  assert.equal(direChezLieuLangue("Chez Nonna Lia", "en"), "at Chez Nonna Lia");
  assert.equal(direDeLieuLangue("Restaurant du Capitaine Bouiboui", "en"), "at Restaurant du Capitaine Bouiboui");
  assert.equal(ecrireNombrePersonnesLangue(1, "en"), "1 person");
  assert.equal(ecrireNombrePersonnesLangue(4, "en"), "4 people");
  assert.equal(ecrireNombreCouvertsLangue(1, "en"), "1 cover");
  assert.equal(ecrireNombreCouvertsLangue(40, "en"), "40 covers");
  assert.equal(formaterDistanceLangue(1.1, "en"), "1.1 km");
  assert.equal(formaterDistanceLangue(0.35, "en"), "350 m");
  assert.equal(ecrireDateLongueLangue("2026-10-01", "en"), "1 October 2026");
  assert.equal(ecrireHeureLangue(new Date(2026, 9, 28, 9, 5), "en"), "09:05");
  assert.equal(ecrireJourLongLangue(new Date(2026, 9, 30, 20, 0), "en", MAINTENANT), "Friday 30 October");
  assert.equal(ecrireJourLongLangue(new Date(2025, 2, 3, 8, 0), "en", MAINTENANT), "Monday 3 March 2025");
  const moments = INSTANTS.map((i) => formaterMomentRelatifLangue(i.toISOString(), "en", MAINTENANT));
  assert.deepEqual(moments, [
    { court: "14:32", lu: "today at 14:32" },
    { court: "Yesterday", lu: "yesterday" },
    { court: "Sat", lu: "Saturday" },
    { court: "1 Oct", lu: "1 October" },
    { court: "3 Mar 2025", lu: "3 March 2025" },
  ]);
});

test("il y a, attente, prénoms, prix lu et mois : le français ne bouge pas, l'anglais suit le glossaire", () => {
  const ilYA = [new Date(2026, 9, 28, 14, 59, 40), new Date(2026, 9, 28, 14, 55), new Date(2026, 9, 28, 14, 59), new Date(2026, 9, 28, 13, 0), new Date(2026, 9, 28, 11, 0), ...INSTANTS];
  for (const instant of ilYA) assert.deepEqual(formaterIlYALangue(instant.toISOString(), "fr", MAINTENANT), formaterIlYA(instant.toISOString(), MAINTENANT));
  for (const ms of [1, 60_000, 61_000, 3_600_000, 3_660_000, 7_200_000, 9_000_000]) assert.equal(ecrireAttenteLangue(ms, "fr"), ecrireAttente(ms));
  for (const prenoms of [[], ["Inès"], ["Inès", "Jade"], ["Inès", "Jade", "Tom"]]) assert.equal(listerPrenomsLangue(prenoms, "fr"), listerPrenoms(prenoms));
  for (const prix of [12, 4.5, 4.05, 1, 0.8, 0.01]) assert.equal(formaterPrixLuLangue(prix, "fr"), formaterPrixLu(prix));
  for (const mois of ["2026-10", "2025-01", "2026-13", "abc"]) assert.equal(ecrireMoisAnneeLangue(mois, "fr"), ecrireMoisAnnee(mois));

  assert.deepEqual(formaterIlYALangue(new Date(2026, 9, 28, 14, 59, 40).toISOString(), "en", MAINTENANT), { court: "just now", lu: "just now" });
  assert.deepEqual(formaterIlYALangue(new Date(2026, 9, 28, 14, 59).toISOString(), "en", MAINTENANT), { court: "1 min ago", lu: "1 minute ago" });
  assert.deepEqual(formaterIlYALangue(new Date(2026, 9, 28, 14, 55).toISOString(), "en", MAINTENANT), { court: "5 min ago", lu: "5 minutes ago" });
  assert.deepEqual(formaterIlYALangue(new Date(2026, 9, 28, 13, 0).toISOString(), "en", MAINTENANT), { court: "2 hours ago", lu: "2 hours ago" });
  assert.deepEqual(formaterIlYALangue(new Date(2026, 9, 27, 21, 0).toISOString(), "en", MAINTENANT), { court: "yesterday", lu: "yesterday" });
  assert.deepEqual(formaterIlYALangue(new Date(2026, 9, 1, 12, 0).toISOString(), "en", MAINTENANT), { court: "1 Oct", lu: "1 October" });
  assert.equal(ecrireAttenteLangue(60_000, "en"), "1\u00a0minute");
  assert.equal(ecrireAttenteLangue(300_000, "en"), "5\u00a0minutes");
  assert.equal(ecrireAttenteLangue(3_600_000, "en"), "1\u00a0hour");
  assert.equal(ecrireAttenteLangue(7_200_000, "en"), "2\u00a0hours");
  assert.equal(ecrireAttenteLangue(3_900_000, "en"), "1\u00a0hr\u00a05\u00a0min");
  assert.equal(listerPrenomsLangue(["Inès", "Jade", "Tom"], "en"), "Inès, Jade and Tom");
  assert.equal(listerPrenomsLangue(["Inès", "Jade"], "en"), "Inès and Jade");
  assert.equal(formaterPrixLuLangue(1, "en"), "1 euro");
  assert.equal(formaterPrixLuLangue(4.5, "en"), "4 euros 50");
  assert.equal(formaterPrixLuLangue(0.01, "en"), "1 cent");
  assert.equal(formaterPrixLuLangue(0.8, "en"), "80 cents");
  assert.equal(ecrireMoisAnneeLangue("2026-10", "en"), "October 2026");
  assert.equal(ecrireMoisAnneeLangue("abc", "en"), "abc");
});

test("heure écrite « 21:30 » : le français ne bouge pas, l'anglais en 24 h", () => {
  for (const heure of ["21:30", "20:00", "09:05", "12:00", "00:15"]) assert.equal(formaterHeureTexteLangue(heure, "fr"), formaterHeure(heure));
  assert.equal(formaterHeureTexteLangue("21:30", "en"), "21:30");
  assert.equal(formaterHeureTexteLangue("20:00", "en"), "20:00");
  assert.equal(formaterHeureTexteLangue("9:05", "en"), "09:05");
});

test("règlement d'une visite : le français ne bouge pas, l'anglais garde « Collaboration commerciale » en premier", () => {
  const reglements = [
    null,
    { type: "paye", reductionPourcent: null, avantages: [] },
    { type: "reduction", reductionPourcent: 20, avantages: ["happy-hour", "partenariat"] },
    { type: "reduction", reductionPourcent: null, avantages: [] },
    { type: "offert", reductionPourcent: null, avantages: ["autre", "autre"] },
  ];
  for (const r of reglements) {
    for (const pour of ["client", "lieu"]) {
      const { titre, etiquettes, offert } = decrireReglementLangue(r, pour, "fr");
      assert.deepEqual({ titre, etiquettes, offert }, decrireReglement(r, pour));
    }
  }
  const { titre, etiquettes, offert } = decrireReglementLangue(reglements[2], "lieu", "en");
  assert.deepEqual({ titre, etiquettes, offert }, {
    titre: "Paid with a discount −20%",
    etiquettes: ["Collaboration commerciale", "Happy hour or set menu"],
    offert: false,
  });
  assert.equal(decrireReglementLangue(reglements[4], "client", "en").titre, "Gifted by the venue");
  assert.equal(decrireReglementLangue(null, "lieu", "en").titre, "Paid");
});

test("heure de Paris : le français rend ecrireHeureParis, l'anglais écrit 24 h avec deux chiffres", () => {
  for (const iso of ["2026-10-28T19:30:00.000Z", "2026-10-28T08:05:00.000Z", "2026-07-01T22:00:00.000Z", "pas une date"]) assert.equal(ecrireHeureParisLangue(iso, "fr"), ecrireHeureParis(iso));
  assert.equal(ecrireHeureParisLangue("2026-10-28T19:30:00.000Z", "en"), "20:30");
  assert.equal(ecrireHeureParisLangue("2026-10-28T08:05:00.000Z", "en"), "09:05");
  assert.equal(ecrireHeureParisLangue("2026-07-01T22:00:00.000Z", "en"), "00:00");
  assert.equal(ecrireHeureParisLangue("pas une date", "en"), "");
});

test("moment long : le français rend ecrireMomentLong, l'anglais écrit la date britannique, « at » et 24 h", () => {
  for (const iso of [...INSTANTS.map((i) => i.toISOString()), null, undefined, "", "pas une date"]) assert.equal(ecrireMomentLongLangue(iso, "fr"), ecrireMomentLong(iso));
  assert.equal(ecrireMomentLongLangue(new Date(2026, 9, 22, 21, 30).toISOString(), "en"), "22 October 2026 at 21:30");
  assert.equal(ecrireMomentLongLangue(new Date(2026, 10, 1, 9, 5).toISOString(), "en"), "1 November 2026 at 09:05");
  assert.equal(ecrireMomentLongLangue(new Date(2026, 9, 23, 0, 0).toISOString(), "en"), "23 October 2026 at midnight");
  assert.equal(ecrireMomentLongLangue(new Date(2026, 9, 23, 12, 0).toISOString(), "en"), "23 October 2026 at midday");
  assert.equal(ecrireMomentLongLangue(null, "en"), null);
  assert.equal(ecrireMomentLongLangue("pas une date", "en"), null);
});

test("fin d'une limitation : le français rend decrireFinLimitation, l'anglais écrit « until … » ou « until further notice »", () => {
  for (const iso of [...INSTANTS.map((i) => i.toISOString()), null, undefined, "", "pas une date"]) assert.equal(decrireFinLimitationLangue(iso, "fr"), decrireFinLimitation(iso));
  assert.equal(decrireFinLimitationLangue(new Date(2026, 9, 22, 21, 30).toISOString(), "en"), "until 22 October 2026 at 21:30");
  assert.equal(decrireFinLimitationLangue(null, "en"), "until further notice");
  assert.equal(decrireFinLimitationLangue("pas une date", "en"), "until further notice");
});

test("règlement lu : « Collaboration commerciale » reste en français, glosé en anglais, et sa clé passe en premier", () => {
  const r = { type: "reduction", reductionPourcent: 20, avantages: ["happy-hour", "partenariat"] };
  assert.deepEqual(decrireReglementLangue(r, "client", "fr").etiquettesLues, ["Collaboration commerciale", "Happy hour ou formule"]);
  assert.deepEqual(decrireReglementLangue(r, "client", "en").etiquettesLues, ["Collaboration commerciale: a paid or gifted partnership", "Happy hour or set menu"]);
  assert.deepEqual(decrireReglementLangue(r, "client", "en").avantages, ["partenariat", "happy-hour"]);
});
